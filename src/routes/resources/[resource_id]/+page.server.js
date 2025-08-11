import { error, fail } from '@sveltejs/kit';
import { resourceDb, maintenanceDb, adminDb } from '$lib/database.js';

export async function load({ params }) {
	const resource = resourceDb.getByResourceId(params.resource_id);
	
	if (!resource) {
		throw error(404, 'Resource not found');
	}
	
	// Get maintenance intervals for this resource
	const maintenanceIntervals = resourceDb.getMaintenanceIntervals(resource.id);
	
	// Get maintenance status (progress calculations) for each interval
	const maintenanceStatus = maintenanceDb.getMaintenanceStatus(resource.id);
	
	// Merge status data with interval data
	const intervalsWithStatus = maintenanceIntervals.map(interval => {
		const status = maintenanceStatus.find(s => s.interval_id === interval.id);
		return {
			...interval,
			progress: status?.progress || 0,
			isOverdue: status?.isOverdue || false,
			nextDue: status?.nextDue || null
		};
	});
	
	// Get recent maintenance events
	const maintenanceEvents = resourceDb.getMaintenanceEvents(resource.id, 10);
	
	// Get recent access logs
	const accessLogs = resourceDb.getAccessLogs(resource.id, 20);
	
	// Get timezone setting
	const timezone = adminDb.getTimezone();
	
	return {
		resource,
		maintenanceIntervals: intervalsWithStatus,
		maintenanceEvents,
		accessLogs,
		timezone
	};
}

export const actions = {
	createMaintenanceInterval: async ({ request, params }) => {
		const data = await request.formData();
		const resource = resourceDb.getByResourceId(params.resource_id);
		
		if (!resource) {
			return fail(404, { error: 'Resource not found' });
		}

		const name = data.get('name');
		const description = data.get('description');
		const intervalType = data.get('interval_type');
		const intervalValue = parseInt(data.get('interval_value'));
		const intervalUnit = data.get('interval_unit');
		const warningThreshold = parseInt(data.get('warning_threshold')) || 0;

		if (!name || !intervalType || !intervalValue || !intervalUnit) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Convert to minutes based on unit
		let valueInMinutes = intervalValue;
		let warningInMinutes = 0; // Default to 0 (no warning)
		
		if (intervalUnit === 'hours') {
			valueInMinutes = intervalValue * 60;
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold * 60;
			}
		} else if (intervalUnit === 'days') {
			valueInMinutes = intervalValue * 60 * 24;
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold * 60 * 24;
			}
		} else if (intervalUnit === 'weeks') {
			valueInMinutes = intervalValue * 60 * 24 * 7;
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold * 60 * 24 * 7;
			}
		} else if (intervalUnit === 'months') {
			valueInMinutes = intervalValue * 60 * 24 * 30; // Approximate month as 30 days
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold * 60 * 24 * 30;
			}
		} else {
			// For minutes or default case
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold;
			}
		}

		try {
			maintenanceDb.createInterval({
				resource_id: resource.id,
				name,
				description,
				interval_type: intervalType,
				interval_value: valueInMinutes,
				warning_threshold: warningInMinutes,
				display_unit: intervalUnit // Store the user's preferred unit
			});

			return { success: true, message: 'Maintenance interval created successfully' };
		} catch (err) {
			console.error('Error creating maintenance interval:', err);
			return fail(500, { error: 'Failed to create maintenance interval' });
		}
	},

	updateMaintenanceInterval: async ({ request, params }) => {
		const data = await request.formData();
		const resource = resourceDb.getByResourceId(params.resource_id);
		
		if (!resource) {
			return fail(404, { error: 'Resource not found' });
		}

		const id = parseInt(data.get('id'));
		const name = data.get('name');
		const description = data.get('description');
		const intervalType = data.get('interval_type');
		const intervalValue = parseInt(data.get('interval_value'));
		const intervalUnit = data.get('interval_unit');
		const warningThreshold = parseInt(data.get('warning_threshold')) || 0;

		if (!id || !name || !intervalType || !intervalValue || !intervalUnit) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Convert to minutes based on unit
		let valueInMinutes = intervalValue;
		let warningInMinutes = 0; // Default to 0 (no warning)
		
		if (intervalUnit === 'hours') {
			valueInMinutes = intervalValue * 60;
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold * 60;
			}
		} else if (intervalUnit === 'days') {
			valueInMinutes = intervalValue * 60 * 24;
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold * 60 * 24;
			}
		} else if (intervalUnit === 'weeks') {
			valueInMinutes = intervalValue * 60 * 24 * 7;
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold * 60 * 24 * 7;
			}
		} else if (intervalUnit === 'months') {
			valueInMinutes = intervalValue * 60 * 24 * 30; // Approximate month as 30 days
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold * 60 * 24 * 30;
			}
		} else {
			// For minutes or default case
			if (warningThreshold > 0) {
				warningInMinutes = warningThreshold;
			}
		}

		try {
			maintenanceDb.updateInterval(id, {
				name,
				description,
				interval_type: intervalType,
				interval_value: valueInMinutes,
				warning_threshold: warningInMinutes,
				display_unit: intervalUnit // Store the user's preferred unit
			});

			return { success: true, message: 'Maintenance interval updated successfully' };
		} catch (err) {
			console.error('Error updating maintenance interval:', err);
			return fail(500, { error: 'Failed to update maintenance interval' });
		}
	},

	deleteMaintenanceInterval: async ({ request, params }) => {
		const data = await request.formData();
		const resource = resourceDb.getByResourceId(params.resource_id);
		
		if (!resource) {
			return fail(404, { error: 'Resource not found' });
		}

		const id = parseInt(data.get('id'));

		if (!id) {
			return fail(400, { error: 'Missing interval ID' });
		}

		try {
			maintenanceDb.deleteInterval(id);
			return { success: true, message: 'Maintenance interval deleted successfully' };
		} catch (err) {
			console.error('Error deleting maintenance interval:', err);
			return fail(500, { error: 'Failed to delete maintenance interval' });
		}
	},

	logMaintenance: async ({ request, params }) => {
		const resource = resourceDb.getByResourceId(params.resource_id);
		
		if (!resource) {
			return fail(404, { error: 'Resource not found' });
		}

		const formData = await request.formData();
		const intervalId = formData.get('interval_id');
		const maintenanceType = formData.get('maintenance_type');
		const notes = formData.get('notes');
		const performedBy = formData.get('performed_by');

		if (!maintenanceType || !notes) {
			return fail(400, { error: 'Maintenance type and notes are required' });
		}

		try {
			// Get interval name if interval_id is provided
			let intervalName = null;
			if (intervalId) {
				const intervals = resourceDb.getMaintenanceIntervals(resource.id);
				const interval = intervals.find(i => i.id === parseInt(intervalId));
				intervalName = interval?.name;
			}

			// Log the maintenance event using maintenanceDb
			maintenanceDb.createMaintenanceEvent({
				resource_id: resource.id,
				interval_id: intervalId ? parseInt(intervalId) : null,
				interval_name: intervalName,
				maintenance_type: maintenanceType,
				notes: notes,
				performed_by: performedBy ? parseInt(performedBy) : null
			});

			return { success: true, message: 'Maintenance logged successfully' };
		} catch (err) {
			console.error('Error logging maintenance:', err);
			return fail(500, { error: 'Failed to log maintenance' });
		}
	}
};
