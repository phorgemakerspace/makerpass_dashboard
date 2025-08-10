import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
    console.log('WebSocket connected');
    
    // Authenticate as device
    const authMessage = {
        "type": "device_auth",
        "device_id": "L1HB3L",
        "api_key": "9587500b8cf5d8a05a6ad2062a9b2e46c262d594b0435a591d0db640b33d9042"
    };
    
    console.log('Sending auth:', JSON.stringify(authMessage));
    ws.send(JSON.stringify(authMessage));
});

ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received:', JSON.stringify(message));
    
    if (message.type === 'auth_success') {
        console.log('Authentication successful, sending RFID scan...');
        
        // Send RFID scan
        setTimeout(() => {
            const rfidMessage = {
                "type": "rfid_scan",
                "device_id": "CTNEFV",
                "rfid_code": "00CF18F4"
            };
            
            console.log('Sending RFID:', JSON.stringify(rfidMessage));
            ws.send(JSON.stringify(rfidMessage));
        }, 1000);
    }
});

ws.on('close', () => {
    console.log('WebSocket disconnected');
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});
