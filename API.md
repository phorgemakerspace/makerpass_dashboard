# MakerPass API Documentation

## WebSocket API for RFID Devices

The MakerPass system uses WebSocket connections for real-time communication with RFID devices. This allows for immediate access control responses and real-time monitoring.

### Connection Details

- **WebSocket URL**: `ws://localhost:3000/ws`
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
  "enabled": true,
  "require_card_present": false
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
  "user_name": "John Doe"
}
```

**Receive (Access Denied):**
```json
{
  "type": "access_denied",
  "reason": "Unknown RFID card"
}
```

**Possible Access Denied Reasons:**
- `"Resource not found"` - Resource doesn't exist in system
- `"Resource is currently disabled"` - Resource has been disabled by admin
- `"Unknown RFID card"` - RFID not found in user database
- `"User account is currently disabled"` - User account has been disabled by admin
- `"Access not granted for this resource"` - User lacks permission for this resource

#### Machine Sessions

For machine resources, all access attempts use session-based tracking:

**Receive (Session Started):**
```json
{
  "type": "session_started",
  "user": "John Doe",
  "session_id": 12345
}
```

**Receive (Session Ended):**
```json
{
  "type": "session_ended", 
  "user": "John Doe",
  "session_id": 12345
}
```

**Note:** The same user scanning their card on a machine will either start a new session (if none active) or end their current session (if one is active).

#### Session End (External Triggers)

Machines can send session end messages through various triggers:

**Send:**
```json
{
  "type": "session_end",
  "session_id": 12345
}
```

**Receive:**
```json
{
  "type": "session_ended",
  "resource_id": "machine-001",
  "session_id": 12345
}
```

**Session End Triggers:**
- **Card removal**: When `require_card_present: true` and RFID card is physically removed
- **Machine toggle**: When machine power/control is manually toggled off
- **Admin action**: Dashboard admin forcefully ending a session
- **System events**: Safety shutdowns, scheduled maintenance, etc.

**Note:** This message is sent by firmware when `require_card_present` is true and the card is removed, when machines are manually toggled off, or by admin systems to forcefully end sessions. The system automatically calculates usage time (session_end - session_start) for maintenance tracking purposes.

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

- Device connection/disconnection (`device_status`)
- Access attempts for doors (`access_event`) 
- Machine session starts (`session_started`)
- Machine session ends (`session_ended`)

**Example Admin Notifications:**
```json
{
  "type": "device_status",
  "resource_id": "door-001", 
  "status": "online"
}
```

```json
{
  "type": "access_event",
  "resource_id": "door-001",
  "user": "John Doe",
  "success": true
}
```

```json
{
  "type": "session_started",
  "resource_id": "machine-001",
  "user": "Jane Smith",
  "session_id": 12345
}
```

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
- Simple access control with immediate `access_granted` response
- No session tracking
- Single log entry per access attempt

#### Machines  
- **All machines use session-based access control**
- RFID scan either starts new session or ends current session
- Session tracking for usage monitoring and maintenance
- The `require_card_present` setting determines firmware behavior:
  - `true`: Firmware monitors card presence and sends `session_end` when card removed
  - `false`: Sessions managed manually via RFID scans or admin actions

#### Access Control Flow

**For Doors:**
1. RFID scan → Access check → `access_granted` or `access_denied`
2. Single log entry created

**For Machines:**
1. RFID scan → Access check → Session logic:
   - No active session → Start new session → `session_started`
   - Active session by same user → End session → `session_ended`
2. Log entries track session start/end with user association
3. **Usage time automatically calculated** (session_end - session_start) for maintenance tracking

### Usage Tracking and Maintenance

All machine sessions automatically track usage time, which is used for:
- **Usage-based maintenance intervals** - Maintenance due after X hours of machine use
- **Maintenance dashboard** - Real-time tracking of machine usage vs. maintenance schedules  
- **Usage analytics** - Understanding machine utilization patterns

**Automatic Usage Calculation:**
- Session start time recorded when session begins
- Session end time recorded when session ends (via RFID, card removal, or manual toggle)
- Usage minutes = (session_end - session_start) automatically calculated and stored
- Usage accumulated across all sessions for maintenance interval calculations

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL, 
    rfid TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

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
            case 'session_started':
                this.handleSessionStarted(message);
                break;
            case 'session_ended':
                this.handleSessionEnded(message);
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

    endSession(sessionId) {
        if (!this.authenticated) {
            console.error('Device not authenticated');
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'session_end',
            session_id: sessionId
        }));
    }

    handleAccessGranted(message) {
        console.log(`Access granted to ${message.user}`);
        // Implement your device-specific access logic here
        // e.g., unlock door, flash green light, etc.
    }

    handleAccessDenied(message) {
        console.log(`Access denied: ${message.reason}`);
        // Implement your device-specific denial logic here
        // e.g., flash red light, display message, etc.
    }

    handleSessionStarted(message) {
        console.log(`Session started for ${message.user}, session ID: ${message.session_id}`);
        // Implement machine enablement logic
        // e.g., enable machine controls, start monitoring, etc.
        this.currentSessionId = message.session_id;
    }

    handleSessionEnded(message) {
        console.log(`Session ended for ${message.user}, session ID: ${message.session_id}`);
        // Implement machine disablement logic  
        // e.g., disable machine controls, stop monitoring, etc.
        this.currentSessionId = null;
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
npm run build
npm run preview  # or npm start
```

The server will run on port 3000 (or PORT env var) and WebSocket server will be available at `/ws` path.
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