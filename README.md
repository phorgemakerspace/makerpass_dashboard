# MakerPass Dashboard

A SvelteKit-based dashboard for managing RFID access control systems. This application provides a web interface for managing users, resources (doors and machines), and viewing access logs, while also providing API endpoints for RFID controllers.

## Features

- **Admin Authentication**: Single admin user with secure login
- **Resource Management**: Manage doors and machines with auto-generated IDs
- **User Management**: Add users with RFID cards and assign resource permissions
- **Access Logs**: View detailed logs of all access attempts with filtering
- **API Endpoints**: RESTful API for RFID controllers to check access permissions
- **Docker Support**: Ready for containerized deployment on TrueNAS or other platforms

## Quick Start

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Web interface: http://localhost:5173
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`

### Production Deployment

#### Using Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Or build manually:**
   ```bash
   docker build -t makerpass-dashboard .
   docker run -d -p 3000:3000 -v $(pwd)/data:/data makerpass-dashboard
   ```

#### Manual Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   node build
   ```

## API Documentation

The application implements the API specification defined in `API.md`:

### Authentication
All API requests require an X-API-Key header. The API key is generated automatically and displayed in the console when the admin user is created.

### Endpoints

#### Check Access
```
POST /api/access
Headers:
  X-API-Key: YOUR_API_KEY
  X-RFID: RFID_CARD_ID
  X-Resource-ID: RESOURCE_ID
```

#### Get Resource
```
GET /api/resource
Headers:
  X-API-Key: YOUR_API_KEY
  X-Resource-ID: RESOURCE_ID
```

## Configuration

### Environment Variables

- `DB_PATH`: Path to SQLite database file (default: `./makerpass.db`)
- `PORT`: Server port (default: `3000`)
- `NODE_ENV`: Environment mode (`development` or `production`)

### Database

The application uses SQLite with better-sqlite3 for data storage. The database is automatically initialized on first run with the required schema.

## Project Structure

```
src/
├── lib/
│   ├── database.js          # Database operations and schema
│   └── auth.js             # Authentication utilities
├── routes/
│   ├── api/
│   │   ├── access/         # Access check endpoint
│   │   └── resource/       # Resource info endpoint
│   ├── login/              # Admin login page
│   ├── resources/          # Resource management
│   ├── users/              # User management
│   ├── logs/               # Access logs
│   └── +layout.svelte      # Main application layout
└── app.css                 # Tailwind CSS styles
```

## TrueNAS Deployment

For TrueNAS deployment, use the Docker Compose configuration:

1. Create a dataset for persistent data
2. Upload the project files to your TrueNAS system
3. Configure the volume mapping in docker-compose.yml to point to your dataset
4. Deploy using TrueNAS Apps or the command line

## Security Notes

- Change the default admin password after first login
- Store the API key securely for RFID controller configuration
- Use HTTPS in production environments
- The database file contains sensitive information - ensure proper backup and security

## Development

### Tech Stack
- **Frontend**: SvelteKit (Svelte 5) with TailwindCSS
- **Backend**: SvelteKit API routes
- **Database**: SQLite with better-sqlite3
- **Authentication**: Cookie-based sessions

### Adding Features
- Database operations are centralized in `src/lib/database.js`
- API endpoints follow the specification in `API.md`
- UI components use TailwindCSS for styling
