import { fail, redirect } from '@sveltejs/kit';
import { resourceDb, adminDb, getDb } from '$lib/database.js';

export async function load() {
	const resources = resourceDb.getAll();
	
	// Group resources by type
	const doors = resources.filter(r => r.type === 'door');
	const machines = resources.filter(r => r.type === 'machine');
	
	return {
		doors,
		machines
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const type = data.get('type');
		const cardPresentRequired = type === 'machine' && data.get('card_present_required') === 'on';

		if (!name || !type) {
			return fail(400, { error: 'Name and type are required' });
		}

		if (!['door', 'machine'].includes(type)) {
			return fail(400, { error: 'Type must be door or machine' });
		}

		try {
			resourceDb.create({
				name,
				type,
				card_present_required: cardPresentRequired
			});
			
			return { success: true };
		} catch (error) {
			console.error('Create resource error:', error);
			return fail(500, { error: 'Failed to create resource' });
		}
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');

		if (!id) {
			return fail(400, { error: 'Resource ID is required' });
		}

		try {
			resourceDb.delete(id);
			return { success: true };
		} catch (error) {
			console.error('Delete resource error:', error);
			return fail(500, { error: 'Failed to delete resource' });
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		const name = data.get('name');
		const type = data.get('type');
		const cardPresentRequired = type === 'machine' && data.get('card_present_required') === 'on';

		if (!id || !name || !type) {
			return fail(400, { error: 'ID, name and type are required' });
		}

		if (!['door', 'machine'].includes(type)) {
			return fail(400, { error: 'Type must be door or machine' });
		}

		try {
			resourceDb.update(id, {
				name,
				type,
				card_present_required: cardPresentRequired
			});
			
			return { success: true };
		} catch (error) {
			console.error('Update resource error:', error);
			return fail(500, { error: 'Failed to update resource' });
		}
	}
};
