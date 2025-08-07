import { createServer } from 'http';
import { handler } from './build/handler.js';
import { rfidWebSocket } from './src/lib/websocket.js';

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Create HTTP server
const server = createServer(handler);

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
