import { resourceDb, maintenanceDb } from '$lib/database.js';

export async function load() {
	const resources = resourceDb.getAll().filter(r => r.type === 'machine');
	
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
		maintenanceData
	};
}
