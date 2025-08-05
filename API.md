# MakerPass API Documentation

## WebSocket API for RFID Devices

The MakerPass system uses WebSocket connections for real-time communication with RFID devices. This allows for immediate access control responses and real-time monitoring.

### Connection Details

- **WebSocket URL**: `ws://localhost:8080`
- **Protocol**: JSON message-based communication
- **Authentication**: API key-based authentication required

### Message Types

#### Device Authentication

**Send:**
```json
{
  "type": "device_auth",
  "device_id": "door-001",
  "api_key": "your-admin-api-key"
}
```

**Receive:**
```json
{
  "type": "auth_success",
  "device_id": "door-001",
  "resource_name": "Main Entrance",
  "enabled": true
}
```

#### RFID Scan

**Send:**
```json
{
  "type": "rfid_scan",
  "device_id": "door-001",
  "rfid_code": "RFID001"
}
```

**Receive (Access Granted):**
```json
{
  "type": "access_granted",
  "user_name": "John Doe",
  "session_id": "session_1234567890_abc123",
  "require_card_present": false
}
```

**Receive (Access Denied):**
```json
{
  "type": "access_denied",
  "reason": "Unknown RFID card"
}
```

#### Session End (for machines with usage tracking)

**Send:**
```json
{
  "type": "session_end",
  "device_id": "machine-001",
  "session_id": "session_1234567890_abc123",
  "usage_minutes": 45
}
```

**Receive:**
```json
{
  "type": "session_ended",
  "session_id": "session_1234567890_abc123"
}
```

#### Keep-Alive

**Send:**
```json
{
  "type": "ping"
}
```

**Receive:**
```json
{
  "type": "pong"
}
```

### Admin Monitoring

Administrators can connect to the WebSocket to monitor real-time activity:

**Send:**
```json
{
  "type": "admin_auth",
  "api_key": "your-admin-api-key"
}
```

**Receive:**
```json
{
  "type": "admin_auth_success",
  "connected_devices": [
    {
      "device_id": "door-001",
      "resource_name": "Main Entrance",
      "status": "online",
      "enabled": true
    }
  ]
}
```

### Real-time Notifications

Authenticated admins receive real-time notifications for:

- Device connection/disconnection
- Access attempts (granted/denied)
- Session start/end events

### Error Handling

**Error Response:**
```json
{
  "type": "error",
  "message": "Description of error"
}
```

**Authentication Error:**
```json
{
  "type": "auth_error",
  "message": "Invalid API key"
}
```

### Resource Types

#### Doors
- Simple access control
- No session tracking
- No card-present requirement

#### Machines
- Optional session tracking
- Optional card-present requirement during use
- Usage time tracking for maintenance

### Database Schema

#### Resources Table
```sql
CREATE TABLE resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('door', 'machine')),
    enabled BOOLEAN DEFAULT TRUE,
    connection_status TEXT DEFAULT 'offline',
    require_card_present BOOLEAN DEFAULT FALSE,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Access Logs Table
```sql
CREATE TABLE access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    resource_id INTEGER NOT NULL,
    rfid TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    access_granted BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT NOT NULL,
    session_id TEXT,
    session_start DATETIME,
    session_end DATETIME,
    usage_minutes INTEGER DEFAULT 0,
    access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_name TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (resource_id) REFERENCES resources (id)
);
```

### Example Implementation

```javascript
const WebSocket = require('ws');

class MakerPassDevice {
    constructor(deviceId, apiKey) {
        this.deviceId = deviceId;
        this.apiKey = apiKey;
        this.ws = null;
        this.authenticated = false;
    }

    connect() {
        this.ws = new WebSocket('ws://localhost:8080');
        
        this.ws.on('open', () => {
            console.log('Connected to MakerPass server');
            this.authenticate();
        });

        this.ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
        });

        this.ws.on('close', () => {
            console.log('Disconnected from MakerPass server');
            this.authenticated = false;
        });
    }

    authenticate() {
        this.ws.send(JSON.stringify({
            type: 'device_auth',
            device_id: this.deviceId,
            api_key: this.apiKey
        }));
    }

    handleMessage(message) {
        switch (message.type) {
            case 'auth_success':
                this.authenticated = true;
                console.log(`Device ${this.deviceId} authenticated`);
                break;
            case 'access_granted':
                this.handleAccessGranted(message);
                break;
            case 'access_denied':
                this.handleAccessDenied(message);
                break;
        }
    }

    scanRFID(rfidCode) {
        if (!this.authenticated) {
            console.error('Device not authenticated');
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'rfid_scan',
            device_id: this.deviceId,
            rfid_code: rfidCode
        }));
    }

    endSession(sessionId, usageMinutes) {
        if (!this.authenticated) {
            console.error('Device not authenticated');
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'session_end',
            device_id: this.deviceId,
            session_id: sessionId,
            usage_minutes: usageMinutes
        }));
    }

    handleAccessGranted(message) {
        console.log(`Access granted to ${message.user_name}`);
        // Implement your device-specific access logic here
        // e.g., unlock door, enable machine, etc.
    }

    handleAccessDenied(message) {
        console.log(`Access denied: ${message.reason}`);
        // Implement your device-specific denial logic here
        // e.g., flash red light, display message, etc.
    }
}

// Usage
const device = new MakerPassDevice('door-001', 'your-api-key');
device.connect();

// Simulate RFID scan
setTimeout(() => {
    device.scanRFID('RFID001');
}, 2000);
```

### Testing with the Included Test Client

The project includes a test client (`src/lib/test-device.js`) that demonstrates the WebSocket API:

```bash
node src/lib/test-device.js
```

This will:
1. Connect to the WebSocket server
2. Authenticate as device `door-001`
3. Simulate several RFID scans
4. Show the responses from the server

### Starting the WebSocket Server

```bash
node src/lib/websocket-server.js
```

The server will run on port 8080 and handle all device connections and admin monitoring.
POST /api/access
```

**Headers:**
```
Content-Type: application/json
X-API-Key: YOUR_API_KEY
X-RFID: RFID_CARD_ID
X-Resource-ID: RESOURCE_ID
```

**Response:**
```json
{
    "status": "granted|denied",
    "reason": "granted|denied|invalid_rfid|access_not_permitted"
}
```

### Get Resource
Retrieves information about a specific resource.

**Request:**
```
GET /api/resource
```

**Headers:**
```
X-API-Key: YOUR_API_KEY
X-Resource-ID: RESOURCE_ID
```

**Response:**
```json
{
    "resource_id": "ABC123",
    "name": "Resource Name",
    "card_present_required": true
}
```

## Status Codes
- **200**: Successful request
- **400**: Bad request (missing/invalid parameters)
- **401**: Unauthorized (invalid API key)
- **405**: Method not allowed
- **500**: Server error

## Response Formats

### Successful Check Access Response
```json
{
    "status": "granted",
    "reason": "granted"
}
```

### Denied Access Response
```json
{
    "status": "denied", 
    "reason": "access_not_permitted"
}
```

### Error Response
```json
{
    "error": "Invalid API key"
}
```