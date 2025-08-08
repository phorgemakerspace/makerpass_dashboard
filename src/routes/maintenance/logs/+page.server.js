import { maintenanceDb, userDb, resourceDb } from '$lib/database.js';

export async function load({ url }) {
	const users = userDb.getAll();
	const resources = resourceDb.getAll().filter(r => r.type === 'machine');
	
	// Get filter parameters from URL
	const resourceId = url.searchParams.get('resource');
	const userId = url.searchParams.get('user');
	const maintenanceType = url.searchParams.get('maintenance_type');
	const startDate = url.searchParams.get('start_date');
	const endDate = url.searchParams.get('end_date');
	const limit = parseInt(url.searchParams.get('limit') || '100');
	
	// Build filter object
	const filters = { limit };
	if (resourceId) filters.resourceId = resourceId;
	if (userId) filters.userId = userId;
	if (maintenanceType) filters.maintenanceType = maintenanceType;
	if (startDate) filters.startDate = startDate + ' 00:00:00';
	if (endDate) filters.endDate = endDate + ' 23:59:59';
	
	const logs = maintenanceDb.getAllMaintenanceLogs(filters);
	
	return {
		logs,
		users,
		resources,
		filters: {
			resourceId,
			userId,
			maintenanceType,
			startDate,
			endDate,
			limit
		}
	};
}
