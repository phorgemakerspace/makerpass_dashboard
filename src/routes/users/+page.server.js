import { fail } from '@sveltejs/kit';
import { userDb, resourceDb, permissionDb, settingsDb } from '$lib/database.js';

export async function load() {
	const users = userDb.getAll();
	const resources = resourceDb.getAll();
	const stripeEnabled = settingsDb.get('stripe_enabled');
	
	console.log('Stripe settings check:', { stripeEnabled, result: stripeEnabled === 'true' });
	console.log('Sample user data:', users[0]); // Log first user to see structure
	
	// Get permissions for each user
	const usersWithPermissions = users.map(user => ({
		...user,
		permissions: permissionDb.getUserPermissions(user.id)
	}));

	return {
		users: usersWithPermissions,
		resources,
		stripeEnabled: stripeEnabled === 'true'
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const rfid = data.get('rfid');
		const email = data.get('email');
		const resourcePermissions = data.getAll('resource_permissions');

		if (!name || !rfid || !email) {
			return fail(400, { error: 'Name, RFID, and email are required' });
		}

		// Validate RFID format (8 hex characters)
		if (!/^[0-9A-Fa-f]{8}$/.test(rfid)) {
			return fail(400, { error: 'RFID must be exactly 8 hexadecimal characters' });
		}

		try {
			const result = userDb.create({
				name,
				rfid: rfid.toUpperCase(),
				email
			});
			const userId = result.lastInsertRowid;
			
			// Add permissions
			for (const resourceId of resourcePermissions) {
				permissionDb.grant(userId, parseInt(resourceId));
			}

			return { success: true };
		} catch (err) {
			if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
				if (err.message.includes('rfid')) {
					return fail(400, { error: 'RFID is already in use' });
				} else if (err.message.includes('email')) {
					return fail(400, { error: 'Email is already in use' });
				}
			}
			console.error('Error creating user:', err);
			return fail(500, { error: 'Failed to create user' });
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id'));
		const name = data.get('name');
		const rfid = data.get('rfid');
		const email = data.get('email');
		const resourcePermissions = data.getAll('resource_permissions');

		if (!name || !rfid || !email) {
			return fail(400, { error: 'Name, RFID, and email are required' });
		}

		// Validate RFID format (8 hex characters)
		if (!/^[0-9A-Fa-f]{8}$/.test(rfid)) {
			return fail(400, { error: 'RFID must be exactly 8 hexadecimal characters' });
		}

		try {
			// Update user
			userDb.update(id, name, rfid.toUpperCase(), email);
			
			// Update permissions
			const db = getDb();
			// Clear existing permissions
			db.prepare('DELETE FROM user_resources WHERE user_id = ?').run(id);
			// Add new permissions
			for (const resourceId of resourcePermissions) {
				permissionDb.grant(id, parseInt(resourceId));
			}

			return { success: true };
		} catch (err) {
			if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
				if (err.message.includes('rfid')) {
					return fail(400, { error: 'RFID is already in use' });
				} else if (err.message.includes('email')) {
					return fail(400, { error: 'Email is already in use' });
				}
			}
			console.error('Error updating user:', err);
			return fail(500, { error: 'Failed to update user' });
		}
	},

	toggleStatus: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id'));
		const enabled = data.get('enabled') === 'true';

		try {
			// Update user status
			const db = getDb();
			db.prepare('UPDATE users SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(enabled ? 1 : 0, id);
			
			return { success: true };
		} catch (err) {
			console.error('Error toggling user status:', err);
			return fail(500, { error: 'Failed to update user status' });
		}
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id'));

		try {
			// Delete user permissions first
			const db = getDb();
			db.prepare('DELETE FROM user_resources WHERE user_id = ?').run(id);
			
			// Delete the user
			userDb.delete(id);

			return { success: true };
		} catch (err) {
			console.error('Error deleting user:', err);
			return fail(500, { error: 'Failed to delete user' });
		}
	}
};
