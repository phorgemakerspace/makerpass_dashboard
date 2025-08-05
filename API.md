# MakerPass API Documentation

## Overview
The MakerPass API allows RFID controllers and other systems to verify access permissions in real-time. The API uses simple HTTP requests and returns JSON responses.

## Authentication
All API requests require an API key for authentication. The key is provided in headers

### Header Authentication (Recommended)
```
X-API-Key: YOUR_API_KEY
```

## Endpoints

### Check Access
Verifies if an RFID card has access to a specific resource.

**Request:**
```
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