import { fail, redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/database.js';

export function load({ cookies }) {
	const sessionId = cookies.get('session');
	if (sessionId === 'admin-logged-in') {
		throw redirect(302, '/');
	}
}

export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username');
		const password = data.get('password');

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required' });
		}

		const admin = adminDb.verifyLogin(username, password);
		
		if (!admin) {
			return fail(401, { error: 'Invalid username or password' });
		}

		// Set session cookie
		cookies.set('session', 'admin-logged-in', {
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		throw redirect(302, '/');
	}
};
