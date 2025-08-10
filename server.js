import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're in build directory or root
const isInBuild = __dirname.endsWith('build');
const handlerPath = isInBuild ? './handler.js' : './build/handler.js';
const websocketPath = isInBuild ? '../src/lib/websocket.js' : './src/lib/websocket.js';

const { handler } = await import(handlerPath);
const { rfidWebSocket } = await import(websocketPath);

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Create HTTP server with IoT-friendly settings
const server = createServer(handler);

// Configure server timeouts for IoT devices
server.keepAliveTimeout = 620000; // 10 minutes + 20 seconds
server.headersTimeout = 630000; // 10 minutes + 30 seconds  
server.timeout = 900000; // 15 minutes total timeout

// Initialize WebSocket server
console.log('Initializing WebSocket server...');
rfidWebSocket.init(server);

// Start the server
server.listen(port, host, () => {
	console.log(`Server running on http://${host}:${port}`);
	console.log(`WebSocket server available on ws://${host}:${port}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('SIGINT received, shutting down gracefully');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});
