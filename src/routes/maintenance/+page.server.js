import { resourceDb, maintenanceDb, adminDb } from '$lib/database.js';
import { fail } from '@sveltejs/kit';

export async function load() {
	const resources = resourceDb.getAll().filter(r => r.type === 'machine');
	
	// Get maintenance threshold setting
	const maintenanceThreshold = adminDb.getMaintenanceThreshold();
	
	// Get maintenance intervals for all machines
	const maintenanceData = [];
	for (const resource of resources) {
		const intervals = resourceDb.getMaintenanceIntervals(resource.id);
		const events = resourceDb.getMaintenanceEvents(resource.id, 5);
		
		// Get real maintenance status for each interval
		const maintenanceStatus = maintenanceDb.getMaintenanceStatus(resource.id);
		
		// Merge status data with interval data
		const intervalsWithStatus = intervals.map(interval => {
			const status = maintenanceStatus.find(s => s.interval_id === interval.id);
			return {
				...interval,
				progress: status?.progress || 0,
				isOverdue: status?.isOverdue || false,
				nextDue: status?.nextDue || null
			};
		});
		
		maintenanceData.push({
			resource,
			intervals: intervalsWithStatus,
			events
		});
	}
	
	return {
		maintenanceData,
		recentLogs: maintenanceDb.getAllMaintenanceLogs({ limit: 5 }),
		settings: {
			maintenance_threshold: maintenanceThreshold
		}
	};
}

export const actions = {
	logGeneralMaintenance: async ({ request }) => {
		const data = await request.formData();
		const resourceId = data.get('resource_id');
		const intervalId = data.get('interval_id') || null;
		const maintenanceType = data.get('maintenance_type');
		const performedBy = data.get('performed_by') || null;
		const notes = data.get('notes');

		if (!resourceId || !maintenanceType || !notes) {
			return fail(400, {
				error: 'Machine, maintenance type, and notes are required'
			});
		}

		try {
			// Get the resource to verify it exists and get the internal ID
			const resource = resourceDb.getByResourceId(resourceId);
			if (!resource) {
				return fail(400, { error: 'Machine not found' });
			}

			// Create the maintenance event
			const event = {
				resource_id: resource.id,
				interval_id: intervalId,
				maintenance_type: maintenanceType,
				performed_by: performedBy,
				notes: notes
			};

			maintenanceDb.createMaintenanceEvent(event);

			return { success: true, message: 'Maintenance logged successfully' };
		} catch (err) {
			console.error('Error logging general maintenance:', err);
			return fail(500, {
				error: 'Failed to log maintenance. Please try again.'
			});
		}
	}
};
