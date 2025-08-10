import { WebSocketServer } from 'ws';
import { adminDb, resourceDb, userDb, logDb, permissionDb } from './database.js';

class RFIDWebSocketServer {
	constructor() {
		this.wss = null;
		this.devices = new Map(); // resourceId -> { ws, lastHeartbeat, status }
		this.admins = new Set(); // admin WebSocket connections
	}

	init(server) {
		this.wss = new WebSocketServer({ 
			server,
			path: '/ws'
		});

		this.wss.on('connection', (ws, request) => {
			console.log('New WebSocket connection');
			
			ws.on('message', (data) => {
				try {
					const message = JSON.parse(data);
					this.handleMessage(ws, message);
				} catch (error) {
					console.error('WebSocket message error:', error);
					ws.send(JSON.stringify({ 
						type: 'error', 
						message: 'Invalid JSON message' 
					}));
				}
			});

			ws.on('close', () => {
				this.handleDisconnect(ws);
			});

			ws.on('error', (error) => {
				console.error('WebSocket error:', error);
			});
		});

		// Heartbeat check every 30 seconds
		setInterval(() => {
			this.checkHeartbeats();
		}, 30000);

		console.log('WebSocket server initialized');
	}

	handleMessage(ws, message) {
		switch (message.type) {
			case 'auth_device':
			case 'device_auth': // Support both formats for compatibility
				this.authenticateDevice(ws, message);
				break;
			case 'auth_admin':
			case 'admin_auth': // Support both formats for compatibility
				this.authenticateAdmin(ws, message);
				break;
			case 'heartbeat':
			case 'ping': // Support ping/pong for compatibility
				this.handleHeartbeat(ws, message);
				break;
			case 'rfid_scan':
				this.handleRFIDScan(ws, message);
				break;
			case 'session_end':
				this.handleSessionEnd(ws, message);
				break;
			case 'status_update':
				this.handleStatusUpdate(ws, message);
				break;
			default:
				ws.send(JSON.stringify({ 
					type: 'error', 
					message: `Unknown message type: ${message.type}` 
				}));
		}
	}

	authenticateDevice(ws, message) {
		const { api_key, resource_id, device_id } = message;
		const resourceId = resource_id || device_id; // Support both parameter names
		
		// Verify API key
		const admin = adminDb.verifyApiKey(api_key);
		if (!admin) {
			ws.send(JSON.stringify({ 
				type: 'auth_error', 
				message: 'Invalid API key' 
			}));
			return;
		}

		// Verify resource exists
		const resource = resourceDb.getByResourceId(resourceId);
		if (!resource) {
			ws.send(JSON.stringify({ 
				type: 'auth_error', 
				message: 'Invalid resource ID' 
			}));
			return;
		}

		// Store device connection
		this.devices.set(resourceId, {
			ws,
			resourceId: resource.id,
			lastHeartbeat: Date.now(),
			status: 'online'
		});

		// Update resource status in database
		resourceDb.updateConnectionStatus(resourceId, 'online');

		ws.resourceId = resourceId;
		ws.isDevice = true;

		ws.send(JSON.stringify({ 
			type: 'auth_success',
			device_id: resourceId, // Include for compatibility
			resource_id: resourceId,
			resource_name: resource.name,
			enabled: Boolean(resource.enabled),
			require_card_present: Boolean(resource.require_card_present),
			resource: {
				id: resource.id,
				resource_id: resource.resource_id,
				name: resource.name,
				type: resource.type,
				enabled: Boolean(resource.enabled),
				require_card_present: Boolean(resource.require_card_present)
			}
		}));

		// Notify admins of device connection
		this.broadcastToAdmins({
			type: 'device_status',
			resource_id: resourceId,
			status: 'online'
		});

		console.log(`Device authenticated: ${resourceId} (${resource.name})`);
	}

	authenticateAdmin(ws, message) {
		const { api_key } = message;
		
		const admin = adminDb.verifyApiKey(api_key);
		if (!admin) {
			ws.send(JSON.stringify({ 
				type: 'auth_error', 
				message: 'Invalid API key' 
			}));
			return;
		}

		this.admins.add(ws);
		ws.isAdmin = true;

		ws.send(JSON.stringify({ 
			type: 'auth_success',
			admin: {
				id: admin.id,
				username: admin.username
			}
		}));

		// Send current device statuses
		const deviceStatuses = Array.from(this.devices.entries()).map(([resourceId, device]) => ({
			resource_id: resourceId,
			status: device.status
		}));

		ws.send(JSON.stringify({
			type: 'device_statuses',
			devices: deviceStatuses
		}));

		console.log(`Admin authenticated: ${admin.username}`);
	}

	handleHeartbeat(ws, message) {
		if (ws.isDevice && ws.resourceId) {
			const device = this.devices.get(ws.resourceId);
			if (device) {
				device.lastHeartbeat = Date.now();
			}
		}
		
		// Support both heartbeat_ack and pong responses
		const responseType = message.type === 'ping' ? 'pong' : 'heartbeat_ack';
		ws.send(JSON.stringify({ type: responseType }));
	}

	handleRFIDScan(ws, message) {
		if (!ws.isDevice || !ws.resourceId) {
			ws.send(JSON.stringify({ 
				type: 'error', 
				message: 'Not authenticated as device' 
			}));
			return;
		}

		const { rfid, rfid_code } = message;
		const rfidCode = rfid || rfid_code; // Support both parameter names
		const resource = resourceDb.getByResourceId(ws.resourceId);
		
		if (!resource) {
			ws.send(JSON.stringify({ 
				type: 'access_denied', 
				reason: 'Resource not found' 
			}));
			return;
		}

		// Check if resource is enabled
		if (!resource.enabled) {
			const log = logDb.create({
				user_id: null,
				resource_id: resource.id,
				rfid: rfidCode,
				success: false,
				reason: 'Resource disabled'
			});

			ws.send(JSON.stringify({ 
				type: 'access_denied', 
				reason: 'Resource is currently disabled' 
			}));
			return;
		}

		// Find user by RFID
		const user = userDb.getByRfid(rfidCode);
		if (!user) {
			const log = logDb.create({
				user_id: null,
				resource_id: resource.id,
				rfid: rfidCode,
				success: false,
				reason: 'Unknown RFID'
			});

			ws.send(JSON.stringify({ 
				type: 'access_denied', 
				reason: 'Unknown RFID card' 
			}));
			return;
		}

		// Check if user is enabled
		if (!user.enabled) {
			const log = logDb.create({
				user_id: user.id,
				resource_id: resource.id,
				rfid: rfidCode,
				success: false,
				reason: 'User disabled'
			});

			ws.send(JSON.stringify({ 
				type: 'access_denied', 
				reason: 'User account is currently disabled' 
			}));
			return;
		}

		// Check permissions
		const hasAccess = permissionDb.hasAccess(user.id, resource.id);
		if (!hasAccess) {
			const log = logDb.create({
				user_id: user.id,
				resource_id: resource.id,
				rfid: rfidCode,
				success: false,
				reason: 'No permission'
			});

			ws.send(JSON.stringify({ 
				type: 'access_denied', 
				reason: 'Access not granted for this resource' 
			}));
			return;
		}

		// Check for active session (for machines that require card present)
		const activeSession = logDb.getActiveSession(resource.id);
		
		if (resource.type === 'machine') {
			if (activeSession) {
				// Same user ending their own session = Session completed
				logDb.endSession(activeSession.id, null, user.id);
				
				ws.send(JSON.stringify({ 
					type: 'session_ended',
					user: user.name,
					session_id: activeSession.id
				}));

				this.broadcastToAdmins({
					type: 'session_ended',
					resource_id: ws.resourceId,
					user: user.name,
					session_id: activeSession.id
				});
			} else {
				// Start new session
				const logResult = logDb.startSession(user.id, resource.id, rfidCode);
				
				ws.send(JSON.stringify({ 
					type: 'session_started',
					user: user.name,
					session_id: logResult.lastInsertRowid
				}));

				this.broadcastToAdmins({
					type: 'session_started',
					resource_id: ws.resourceId,
					user: user.name,
					session_id: logResult.lastInsertRowid
				});
			}
		} else {
			// Simple access grant for doors
			const log = logDb.create({
				user_id: user.id,
				resource_id: resource.id,
				rfid: rfidCode,
				success: true,
				reason: 'Access granted'
			});

			ws.send(JSON.stringify({ 
				type: 'access_granted',
				user: user.name
			}));

			this.broadcastToAdmins({
				type: 'access_event',
				resource_id: ws.resourceId,
				user: user.name,
				success: true
			});
		}
	}

	handleSessionEnd(ws, message) {
		if (!ws.isDevice || !ws.resourceId) {
			return;
		}

		const { session_id } = message;
		if (session_id) {
			// This is typically an admin or system ending the session
			// so we don't pass an ending user ID, which will result in "Session ended"
			logDb.endSession(session_id);
			
			this.broadcastToAdmins({
				type: 'session_ended',
				resource_id: ws.resourceId,
				session_id
			});
		}
	}

	handleStatusUpdate(ws, message) {
		if (!ws.isDevice || !ws.resourceId) {
			return;
		}

		this.broadcastToAdmins({
			type: 'device_status_update',
			resource_id: ws.resourceId,
			...message.status
		});
	}

	handleDisconnect(ws) {
		if (ws.isDevice && ws.resourceId) {
			// Update resource status
			resourceDb.updateConnectionStatus(ws.resourceId, 'offline');
			
			// Remove from devices map
			this.devices.delete(ws.resourceId);

			// Notify admins
			this.broadcastToAdmins({
				type: 'device_status',
				resource_id: ws.resourceId,
				status: 'offline'
			});

			console.log(`Device disconnected: ${ws.resourceId}`);
		}

		if (ws.isAdmin) {
			this.admins.delete(ws);
			console.log('Admin disconnected');
		}
	}

	checkHeartbeats() {
		const now = Date.now();
		const timeout = 60000; // 1 minute timeout

		for (const [resourceId, device] of this.devices.entries()) {
			if (now - device.lastHeartbeat > timeout) {
				console.log(`Device timeout: ${resourceId}`);
				device.ws.terminate();
				this.devices.delete(resourceId);
				resourceDb.updateConnectionStatus(resourceId, 'offline');
				
				this.broadcastToAdmins({
					type: 'device_status',
					resource_id: resourceId,
					status: 'offline'
				});
			}
		}
	}

	broadcastToAdmins(message) {
		const messageStr = JSON.stringify(message);
		
		for (const admin of this.admins) {
			if (admin.readyState === 1) { // WebSocket.OPEN
				admin.send(messageStr);
			}
		}
	}

	// Public methods for external use
	sendToDevice(resourceId, message) {
		const device = this.devices.get(resourceId);
		if (device && device.ws.readyState === 1) {
			device.ws.send(JSON.stringify(message));
			return true;
		}
		return false;
	}

	getDeviceStatus(resourceId) {
		const device = this.devices.get(resourceId);
		return device ? device.status : 'offline';
	}

	getConnectedDevices() {
		return Array.from(this.devices.keys());
	}
}

export const rfidWebSocket = new RFIDWebSocketServer();
export default rfidWebSocket;
