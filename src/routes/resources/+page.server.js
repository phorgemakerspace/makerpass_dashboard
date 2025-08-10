import { fail, redirect } from '@sveltejs/kit';
import { resourceDb, adminDb, logDb, getDb } from '$lib/database.js';

export async function load() {
	const resources = resourceDb.getAll();
	
	// Enhance resources with session/access data
	const enhancedResources = resources.map(resource => {
		if (resource.type === 'machine') {
			// For machines, get active session data
			const activeSession = logDb.getActiveSession(resource.id);
			return {
				...resource,
				activeSession,
				isActive: !!activeSession,
				activeUser: activeSession?.user_name || null
			};
		} else {
			// For doors, get most recent access
			const recentAccess = logDb.getRecentAccess(resource.id);
			return {
				...resource,
				recentAccess,
				lastUser: recentAccess?.user_name || null,
				lastAccess: recentAccess?.access_time || null
			};
		}
	});
	
	// Group resources by type
	const doors = enhancedResources.filter(r => r.type === 'door');
	const machines = enhancedResources.filter(r => r.type === 'machine');
	
	// Group machines by category
	const machinesByCategory = {};
	machines.forEach(machine => {
		const category = machine.category || 'Other';
		if (!machinesByCategory[category]) {
			machinesByCategory[category] = [];
		}
		machinesByCategory[category].push(machine);
	});
	
	return {
		resources: enhancedResources,
		groupedResources: {
			doors,
			machines: machinesByCategory
		}
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const type = data.get('type');
		const category = data.get('category') || null;
		const requireCardPresent = data.get('require_card_present') === 'on';

		if (!name || !type) {
			return fail(400, { error: 'Name and type are required' });
		}

		if (!['door', 'machine'].includes(type)) {
			return fail(400, { error: 'Type must be door or machine' });
		}

		if (type === 'machine' && !category) {
			return fail(400, { error: 'Category is required for machines' });
		}

		try {
			resourceDb.create({
				name,
				type,
				category,
				require_card_present: requireCardPresent
			});
			
			return { success: true, message: 'Resource created successfully' };
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
			return { success: true, message: 'Resource deleted successfully' };
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
		const category = data.get('category') || null;
		const requireCardPresent = data.get('require_card_present') === 'on';

		if (!id || !name || !type) {
			return fail(400, { error: 'ID, name and type are required' });
		}

		if (!['door', 'machine'].includes(type)) {
			return fail(400, { error: 'Type must be door or machine' });
		}

		if (type === 'machine' && !category) {
			return fail(400, { error: 'Category is required for machines' });
		}

		try {
			// Get current resource to preserve enabled status
			const currentResource = resourceDb.getById(id);
			if (!currentResource) {
				return fail(404, { error: 'Resource not found' });
			}

			resourceDb.update(id, {
				name,
				type,
				category,
				require_card_present: requireCardPresent,
				enabled: currentResource.enabled // Preserve current enabled status
			});
			
			return { success: true, message: 'Resource updated successfully' };
		} catch (error) {
			console.error('Update resource error:', error);
			return fail(500, { error: 'Failed to update resource' });
		}
	},

	toggleStatus: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		const enabled = data.get('enabled') === 'true';

		if (!id) {
			return fail(400, { error: 'Resource ID is required' });
		}

		try {
			resourceDb.updateStatus(id, enabled);
			return { success: true, message: `Resource ${enabled ? 'enabled' : 'disabled'} successfully` };
		} catch (error) {
			console.error('Toggle status error:', error);
			return fail(500, { error: 'Failed to update resource status' });
		}
	}
};
