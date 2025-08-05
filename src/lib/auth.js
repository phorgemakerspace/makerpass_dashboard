import { redirect } from '@sveltejs/kit';
import { adminDb } from './database.js';

export function requireAuth(cookies) {
	const sessionId = cookies.get('session');
	if (!sessionId || sessionId !== 'admin-logged-in') {
		throw redirect(302, '/login');
	}
}

export function verifyApiKey(request) {
	const apiKey = request.headers.get('X-API-Key');
	if (!apiKey) {
		return { valid: false, error: 'Missing API key' };
	}

	const admin = adminDb.verifyApiKey(apiKey);
	if (!admin) {
		return { valid: false, error: 'Invalid API key' };
	}

	return { valid: true, admin };
}

export function validateRfid(rfid) {
	// RFID should be 8-character hexadecimal string
	const rfidRegex = /^[0-9A-Fa-f]{8}$/;
	return rfidRegex.test(rfid);
}

export function validateEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
