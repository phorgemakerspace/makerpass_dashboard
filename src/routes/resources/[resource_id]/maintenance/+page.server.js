import { error } from '@sveltejs/kit';
import { resourceDb, maintenanceDb } from '$lib/database.js';

export async function load({ params }) {
	const resource = resourceDb.getByResourceId(params.resource_id);
	
	if (!resource) {
		throw error(404, 'Resource not found');
	}
	
	try {
		// Get all maintenance events for this resource (no limit)
		const maintenanceEvents = maintenanceDb.getMaintenanceEvents(resource.id);
		
		// Get maintenance intervals for this resource
		const maintenanceIntervals = resourceDb.getMaintenanceIntervals(resource.id);
		
		return {
			resource,
			maintenanceEvents,
			maintenanceIntervals
		};
	} catch (err) {
		console.error('Error loading maintenance logs:', err);
		throw error(500, 'Error loading maintenance logs');
	}
}
