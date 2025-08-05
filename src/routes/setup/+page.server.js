import { adminDb } from '$lib/database.js';
import { redirect } from '@sveltejs/kit';

export async function load() {
	// If admin already exists, redirect to login
	if (!adminDb.needsSetup()) {
		throw redirect(303, '/login');
	}
	
	return {};
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username');
		const password = data.get('password');
		const confirmPassword = data.get('confirm_password');

		// Validation
		if (!username || !password || !confirmPassword) {
			return {
				error: 'All fields are required'
			};
		}

		if (username.length < 3) {
			return {
				error: 'Username must be at least 3 characters long'
			};
		}

		if (password.length < 8) {
			return {
				error: 'Password must be at least 8 characters long'
			};
		}

		if (password !== confirmPassword) {
			return {
				error: 'Passwords do not match'
			};
		}

		try {
			// Create the initial admin user
			const result = adminDb.createInitialAdmin(username, password);
			
			// Redirect to login page with success message
			throw redirect(303, '/login?setup=success');
		} catch (error) {
			console.error('Setup error:', error);
			return {
				error: 'Failed to create administrator account. Please try again.'
			};
		}
	}
};
