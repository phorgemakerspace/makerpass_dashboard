import { error, fail, redirect } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

const db = new Database(env.DATABASE_PATH || './makerpass.db');

export async function load({ params }) {
	const userId = parseInt(params.id);
	
	if (isNaN(userId)) {
		throw error(404, 'User not found');
	}

	// Get user details
	const user = db.prepare(`
		SELECT id, name, email, rfid, enabled, 
			   address, customer_id, subscription_type, 
			   subscription_expires, created_at, updated_at
		FROM users 
		WHERE id = ?
	`).get(userId);

	if (!user) {
		throw error(404, 'User not found');
	}

	// Get user permissions
	const permissions = db.prepare(`
		SELECT r.id, r.name, r.type
		FROM resources r
		JOIN user_resources ur ON r.id = ur.resource_id
		WHERE ur.user_id = ?
		ORDER BY r.name
	`).all(userId);

	// Get all available resources
	const allResources = db.prepare(`
		SELECT id, name, type
		FROM resources
		ORDER BY name
	`).all();

	// Get user activity logs (recent access)
	const recentActivity = db.prepare(`
		SELECT al.timestamp, r.name as resource_name, r.type as resource_type
		FROM access_logs al
		JOIN resources r ON al.resource_id = r.id
		WHERE al.user_id = ?
		ORDER BY al.timestamp DESC
		LIMIT 10
	`).all(userId);

	// Get settings to check if Stripe integration is enabled
	const settings = db.prepare(`
		SELECT key, value
		FROM settings
		WHERE key IN ('stripe_enabled', 'stripe_public_key')
	`).all();

	const settingsMap = settings.reduce((acc, setting) => {
		acc[setting.key] = setting.value;
		return acc;
	}, {});

	return {
		user: {
			...user,
			permissions
		},
		allResources,
		recentActivity,
		settings: settingsMap
	};
}

export const actions = {
	updateUser: async ({ request, params }) => {
		const userId = parseInt(params.id);
		const data = await request.formData();

		const name = data.get('name');
		const email = data.get('email');
		const rfid = data.get('rfid')?.trim(); // Trim whitespace
		const enabled = data.get('enabled') === 'true';
		const address = data.get('address');

		if (!name || !email || !rfid) {
			return fail(400, { error: 'Name, email, and RFID are required' });
		}

		// Validate RFID format (8 hex characters)
		if (!/^[0-9A-Fa-f]{8}$/.test(rfid)) {
			const invalidChars = rfid.split('').filter(char => !/[0-9A-Fa-f]/.test(char));
			const errorMessage = invalidChars.length > 0 
				? `RFID must contain only hexadecimal characters (0-9, A-F). Invalid characters found: ${invalidChars.join(', ')}`
				: `RFID must be exactly 8 hexadecimal characters. Got: "${rfid}" (length: ${rfid.length})`;
			
			return fail(400, { error: errorMessage });
		}

		// Check if RFID is already in use by another user
		const existingRfid = db.prepare('SELECT id FROM users WHERE rfid = ? AND id != ?').get(rfid.toUpperCase(), userId);
		if (existingRfid) {
			return fail(400, { error: 'RFID is already in use by another user' });
		}

		try {
			// Update user
			db.prepare(`
				UPDATE users 
				SET name = ?, email = ?, rfid = ?, enabled = ?, address = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).run(name, email, rfid.toUpperCase(), enabled ? 1 : 0, address || null, userId);

			// Update permissions
			const resourcePermissions = data.getAll('resource_permissions');
			
			// Delete existing permissions
			db.prepare('DELETE FROM user_resources WHERE user_id = ?').run(userId);
			
			// Insert new permissions
			const insertPermission = db.prepare('INSERT INTO user_resources (user_id, resource_id) VALUES (?, ?)');
			for (const resourceId of resourcePermissions) {
				insertPermission.run(userId, parseInt(resourceId));
			}

			return { success: true, message: 'User updated successfully' };
		} catch (err) {
			console.error('Error updating user:', err);
			return fail(500, { error: 'Failed to update user' });
		}
	},

	deleteUser: async ({ params }) => {
		const userId = parseInt(params.id);
		
		try {
			// Delete user permissions first
			db.prepare('DELETE FROM user_resources WHERE user_id = ?').run(userId);
			
			// Delete the user
			const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
			
			if (result.changes === 0) {
				return fail(404, { error: 'User not found' });
			}
		} catch (err) {
			console.error('Error deleting user:', err);
			return fail(500, { error: 'Failed to delete user' });
		}

		throw redirect(303, '/users');
	}
};
