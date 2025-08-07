import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
	// Note: WebSocket server is disabled in development to avoid conflicts with Vite HMR
	// Use production mode (npm run build && npm run preview) to test WebSocket functionality
});
