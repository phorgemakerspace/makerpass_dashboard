import { fail } from '@sveltejs/kit';
import { userDb, resourceDb, permissionDb } from '$lib/database.js';
import { validateRfid, validateEmail } from '$lib/auth.js';

export async function load() {
	const users = userDb.getAll();
	const resources = resourceDb.getAll();
	
	// Get permissions for each user
	const usersWithPermissions = users.map(user => ({
		...user,
		permissions: permissionDb.getUserPermissions(user.id)
	}));
	
	return {
		users: usersWithPermissions,
		resources
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const rfid = data.get('rfid').toUpperCase();
		const email = data.get('email');

		if (!name || !rfid || !email) {
			return fail(400, { error: 'Name, RFID, and email are required' });
		}

		console.log('RFID validation debug:', {
			original: data.get('rfid'),
			uppercase: rfid,
			length: rfid.length,
			chars: rfid.split('').map(c => c.charCodeAt(0))
		});

		if (!validateRfid(rfid)) {
			return fail(400, { error: 'RFID must be an 8-character hexadecimal string' });
		}

		if (!validateEmail(email)) {
			return fail(400, { error: 'Invalid email format' });
		}

		try {
			const result = userDb.create({ name, rfid, email });
			
			// Grant permissions to selected resources
			const resourceIds = data.getAll('resource_permissions');
			for (const resourceId of resourceIds) {
				permissionDb.grant(result.lastInsertRowid, resourceId);
			}
			
			return { success: true };
		} catch (error) {
			console.error('Create user error:', error);
			if (error.message.includes('UNIQUE constraint failed')) {
				return fail(400, { error: 'RFID or email already exists' });
			}
			return fail(500, { error: 'Failed to create user' });
		}
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');

		if (!id) {
			return fail(400, { error: 'User ID is required' });
		}

		try {
			userDb.delete(id);
			return { success: true };
		} catch (error) {
			console.error('Delete user error:', error);
			return fail(500, { error: 'Failed to delete user' });
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		const name = data.get('name');
		const rfid = data.get('rfid').toUpperCase();
		const email = data.get('email');

		if (!id || !name || !rfid || !email) {
			return fail(400, { error: 'ID, name, RFID, and email are required' });
		}

		if (!validateRfid(rfid)) {
			return fail(400, { error: 'RFID must be an 8-character hexadecimal string' });
		}

		if (!validateEmail(email)) {
			return fail(400, { error: 'Invalid email format' });
		}

		try {
			userDb.update(id, { name, rfid, email });
			
			// Update permissions - remove all existing and add selected ones
			const userPermissions = permissionDb.getUserPermissions(id);
			for (const permission of userPermissions) {
				permissionDb.revoke(id, permission.id);
			}
			
			const resourceIds = data.getAll('resource_permissions');
			for (const resourceId of resourceIds) {
				permissionDb.grant(id, resourceId);
			}
			
			return { success: true };
		} catch (error) {
			console.error('Update user error:', error);
			if (error.message.includes('UNIQUE constraint failed')) {
				return fail(400, { error: 'RFID or email already exists' });
			}
			return fail(500, { error: 'Failed to update user' });
		}
	}
};
