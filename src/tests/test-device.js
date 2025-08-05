import WebSocket from 'ws';

// Get admin API key from database first
import Database from 'better-sqlite3';
const db = new Database('makerpass.db');
const admin = db.prepare('SELECT api_key FROM admin LIMIT 1').get();

if (!admin) {
	console.error('No admin found in database. Please set up admin first.');
	process.exit(1);
}

const API_KEY = admin.api_key;
const DEVICE_ID = 'QCX8IZ'; // Test with the main entrance door

// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
	console.log('Connected to WebSocket server');
	
	// Authenticate as device
	console.log(`Authenticating device ${DEVICE_ID}...`);
	ws.send(JSON.stringify({
		type: 'device_auth',
		device_id: DEVICE_ID,
		api_key: API_KEY
	}));
});

ws.on('message', function message(data) {
	const msg = JSON.parse(data.toString());
	console.log('Received message:', msg);
	
	if (msg.type === 'auth_success') {
		console.log(`\n✅ Device authenticated successfully!`);
		console.log(`Device: ${msg.resource_name}`);
		console.log(`Enabled: ${msg.enabled}`);
		
		// Simulate RFID scans after authentication
		console.log(`\nSimulating RFID scans in 3 seconds...`);
		setTimeout(() => {
			simulateRFIDScans();
		}, 3000);
	}
});

ws.on('close', function close() {
	console.log('Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
	console.error('WebSocket error:', err);
});

function simulateRFIDScans() {
	// Simulate scanning John Doe's card (should work)
	console.log(`\n🔍 Simulating RFID scan: RFID001 (John Doe)`);
	ws.send(JSON.stringify({
		type: 'rfid_scan',
		device_id: DEVICE_ID,
		rfid_code: 'RFID001'
	}));
	
	// Simulate scanning unknown card after 2 seconds
	setTimeout(() => {
		console.log(`\n🔍 Simulating RFID scan: UNKNOWN123 (Unknown card)`);
		ws.send(JSON.stringify({
			type: 'rfid_scan',
			device_id: DEVICE_ID,
			rfid_code: 'UNKNOWN123'
		}));
	}, 2000);
	
	// Simulate another valid scan after 4 seconds
	setTimeout(() => {
		console.log(`\n🔍 Simulating RFID scan: RFID002 (Jane Smith)`);
		ws.send(JSON.stringify({
			type: 'rfid_scan',
			device_id: DEVICE_ID,
			rfid_code: 'RFID002'
		}));
	}, 4000);
}

// Keep process alive
process.on('SIGINT', () => {
	console.log('\nClosing connection...');
	ws.close();
	process.exit(0);
});
