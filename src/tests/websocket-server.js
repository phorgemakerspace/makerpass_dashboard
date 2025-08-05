import WebSocket, { WebSocketServer } from 'ws';
import Database from 'better-sqlite3';

// Initialize database connection
const db = new Database('makerpass.db');

// WebSocket server setup
const wss = new WebSocketServer({ port: 8080 });

console.log('RFID WebSocket Server running on ws://localhost:8080');

// Connected devices and admins
const connectedDevices = new Map();
const connectedAdmins = new Set();

wss.on('connection', function connection(ws, request) {
	console.log('New WebSocket connection from:', request.connection.remoteAddress);
	
	ws.on('message', function message(data) {
		try {
			const message = JSON.parse(data.toString());
			console.log('Received message:', message);
			
			handleMessage(ws, message);
		} catch (error) {
			console.error('Error parsing message:', error);
			ws.send(JSON.stringify({
				type: 'error',
				message: 'Invalid message format'
			}));
		}
	});
	
	ws.on('close', function close() {
		console.log('WebSocket connection closed');
		
		// Remove from connected devices/admins
		for (const [deviceId, device] of connectedDevices.entries()) {
			if (device.ws === ws) {
				connectedDevices.delete(deviceId);
				console.log(`Device ${deviceId} disconnected`);
				break;
			}
		}
		connectedAdmins.delete(ws);
	});
	
	ws.on('error', function error(err) {
		console.error('WebSocket error:', err);
	});
});

function handleMessage(ws, message) {
	switch (message.type) {
		case 'device_auth':
			handleDeviceAuth(ws, message);
			break;
		case 'admin_auth':
			handleAdminAuth(ws, message);
			break;
		case 'rfid_scan':
			handleRFIDScan(ws, message);
			break;
		case 'session_end':
			handleSessionEnd(ws, message);
			break;
		case 'ping':
			ws.send(JSON.stringify({ type: 'pong' }));
			break;
		default:
			ws.send(JSON.stringify({
				type: 'error',
				message: `Unknown message type: ${message.type}`
			}));
	}
}

function handleDeviceAuth(ws, message) {
	const { device_id, api_key } = message;
	
	// Verify API key against admin table
	const admin = db.prepare('SELECT api_key FROM admin WHERE api_key = ?').get(api_key);
	if (!admin) {
		ws.send(JSON.stringify({
			type: 'auth_error',
			message: 'Invalid API key'
		}));
		return;
	}
	
	// Verify resource exists
	const resource = db.prepare('SELECT * FROM resources WHERE resource_id = ?').get(device_id);
	if (!resource) {
		ws.send(JSON.stringify({
			type: 'auth_error',
			message: 'Unknown device ID'
		}));
		return;
	}
	
	// Store device connection
	connectedDevices.set(device_id, {
		ws,
		resource,
		authenticated: true,
		lastPing: Date.now()
	});
	
	// Update connection status in database
	db.prepare('UPDATE resources SET connection_status = ? WHERE resource_id = ?')
		.run('online', device_id);
	
	// Send success response
	ws.send(JSON.stringify({
		type: 'auth_success',
		device_id,
		resource_name: resource.name,
		enabled: Boolean(resource.enabled)
	}));
	
	console.log(`Device ${device_id} (${resource.name}) authenticated and connected`);
	
	// Notify admins
	broadcastToAdmins({
		type: 'device_status',
		device_id,
		status: 'online',
		resource_name: resource.name
	});
}

function handleAdminAuth(ws, message) {
	const { api_key } = message;
	
	// Verify API key
	const admin = db.prepare('SELECT * FROM admin WHERE api_key = ?').get(api_key);
	if (!admin) {
		ws.send(JSON.stringify({
			type: 'auth_error',
			message: 'Invalid admin API key'
		}));
		return;
	}
	
	// Add to admin connections
	connectedAdmins.add(ws);
	
	// Send current device statuses
	const deviceStatuses = [];
	for (const [deviceId, device] of connectedDevices.entries()) {
		deviceStatuses.push({
			device_id: deviceId,
			resource_name: device.resource.name,
			status: 'online',
			enabled: Boolean(device.resource.enabled)
		});
	}
	
	ws.send(JSON.stringify({
		type: 'admin_auth_success',
		connected_devices: deviceStatuses
	}));
	
	console.log('Admin authenticated and connected');
}

function handleRFIDScan(ws, message) {
	const { device_id, rfid_code } = message;
	
	const device = connectedDevices.get(device_id);
	if (!device || !device.authenticated) {
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Device not authenticated'
		}));
		return;
	}
	
	console.log(`RFID scan on device ${device_id}: ${rfid_code}`);
	
	// Check if resource is enabled
	if (!device.resource.enabled) {
		const logData = {
			user_id: null,
			resource_id: device.resource.id,
			rfid: rfid_code,
			success: false,
			access_granted: false,
			reason: 'Resource disabled',
			user_name: null
		};
		
		// Log the access attempt
		logAccess(logData);
		
		ws.send(JSON.stringify({
			type: 'access_denied',
			reason: 'Resource is currently disabled'
		}));
		
		broadcastToAdmins({
			type: 'access_log',
			device_id,
			rfid_code,
			result: 'denied',
			reason: 'Resource disabled'
		});
		
		return;
	}
	
	// Look up user by RFID
	const user = db.prepare('SELECT * FROM users WHERE rfid = ?').get(rfid_code);
	if (!user) {
		const logData = {
			user_id: null,
			resource_id: device.resource.id,
			rfid: rfid_code,
			success: false,
			access_granted: false,
			reason: 'Unknown RFID card',
			user_name: null
		};
		
		logAccess(logData);
		
		ws.send(JSON.stringify({
			type: 'access_denied',
			reason: 'Unknown RFID card'
		}));
		
		broadcastToAdmins({
			type: 'access_log',
			device_id,
			rfid_code,
			result: 'denied',
			reason: 'Unknown RFID card'
		});
		
		return;
	}
	
	// Check if user has access to this resource
	const userResource = db.prepare(`
		SELECT ur.* FROM user_resources ur 
		WHERE ur.user_id = ? AND ur.resource_id = ?
	`).get(user.id, device.resource.id);
	
	if (!userResource) {
		const logData = {
			user_id: user.id,
			resource_id: device.resource.id,
			rfid: rfid_code,
			success: false,
			access_granted: false,
			reason: 'Access not granted for this resource',
			user_name: user.name
		};
		
		logAccess(logData);
		
		ws.send(JSON.stringify({
			type: 'access_denied',
			reason: 'You do not have access to this resource'
		}));
		
		broadcastToAdmins({
			type: 'access_log',
			device_id,
			rfid_code,
			user_name: user.name,
			result: 'denied',
			reason: 'No access permission'
		});
		
		return;
	}
	
	// Access granted!
	const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	
	// Create descriptive reason based on resource type
	let reason;
	if (device.resource.type === 'machine') {
		reason = 'Session started';
	} else {
		reason = 'Access granted';
	}
	
	const logData = {
		user_id: user.id,
		resource_id: device.resource.id,
		rfid: rfid_code,
		success: true,
		access_granted: true,
		reason: reason,
		session_id: device.resource.type === 'machine' ? sessionId : null,
		session_start: device.resource.type === 'machine' ? new Date().toISOString() : null,
		user_name: user.name
	};
	
	logAccess(logData);
	
	ws.send(JSON.stringify({
		type: 'access_granted',
		user_name: user.name,
		session_id: sessionId,
		require_card_present: Boolean(device.resource.require_card_present)
	}));
	
	broadcastToAdmins({
		type: 'access_log',
		device_id,
		rfid_code,
		user_name: user.name,
		result: 'granted',
		session_id: sessionId
	});
	
	console.log(`Access granted to ${user.name} for ${device.resource.name}`);
}

function handleSessionEnd(ws, message) {
	const { device_id, session_id, usage_minutes } = message;
	
	const device = connectedDevices.get(device_id);
	if (!device || !device.authenticated) {
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Device not authenticated'
		}));
		return;
	}
	
	// Get the session data first to get user information
	const sessionData = db.prepare(`
		SELECT user_id, user_name, resource_id 
		FROM access_logs 
		WHERE session_id = ? AND session_end IS NULL
	`).get(session_id);
	
	// Update access log with session end time and usage
	db.prepare(`
		UPDATE access_logs 
		SET session_end = CURRENT_TIMESTAMP, usage_minutes = ? 
		WHERE session_id = ?
	`).run(usage_minutes || 0, session_id);
	
	// Create a new log entry for session end
	if (sessionData) {
		const endLogData = {
			user_id: sessionData.user_id,
			resource_id: sessionData.resource_id,
			rfid: '', // No RFID for session end
			success: true,
			access_granted: true,
			reason: 'Session ended',
			session_id: session_id,
			session_start: null,
			session_end: new Date().toISOString(),
			usage_minutes: usage_minutes || 0,
			user_name: sessionData.user_name
		};
		
		logAccess(endLogData);
	}
	
	ws.send(JSON.stringify({
		type: 'session_ended',
		session_id
	}));
	
	broadcastToAdmins({
		type: 'session_end',
		device_id,
		session_id,
		usage_minutes: usage_minutes || 0
	});
	
	console.log(`Session ${session_id} ended on device ${device_id}, usage: ${usage_minutes || 0} minutes`);
}

function logAccess(logData) {
	try {
		db.prepare(`
			INSERT INTO access_logs (
				user_id, resource_id, rfid, success, access_granted, reason, 
				session_id, session_start, usage_minutes, user_name
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).run(
			logData.user_id,
			logData.resource_id,
			logData.rfid,
			logData.success ? 1 : 0,
			logData.access_granted ? 1 : 0,
			logData.reason,
			logData.session_id || null,
			logData.session_start || null,
			logData.usage_minutes || 0,
			logData.user_name
		);
	} catch (error) {
		console.error('Error logging access:', error);
	}
}

function broadcastToAdmins(message) {
	const messageStr = JSON.stringify(message);
	connectedAdmins.forEach(adminWs => {
		if (adminWs.readyState === WebSocket.OPEN) {
			adminWs.send(messageStr);
		}
	});
}

// Periodic cleanup of disconnected devices
setInterval(() => {
	const now = Date.now();
	for (const [deviceId, device] of connectedDevices.entries()) {
		if (device.ws.readyState !== WebSocket.OPEN) {
			console.log(`Cleaning up disconnected device: ${deviceId}`);
			connectedDevices.delete(deviceId);
			
			// Update connection status in database
			db.prepare('UPDATE resources SET connection_status = ? WHERE resource_id = ?')
				.run('offline', deviceId);
			
			// Notify admins
			broadcastToAdmins({
				type: 'device_status',
				device_id: deviceId,
				status: 'offline'
			});
		}
	}
	
	// Clean up disconnected admins
	for (const adminWs of connectedAdmins) {
		if (adminWs.readyState !== WebSocket.OPEN) {
			connectedAdmins.delete(adminWs);
		}
	}
}, 30000); // Check every 30 seconds
