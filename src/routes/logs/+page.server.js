import { logDb, userDb, resourceDb, adminDb } from '$lib/database.js';

export async function load({ url }) {
	const users = userDb.getAll();
	const resources = resourceDb.getAll();
	
	// Get filter parameters from URL
	const resourceId = url.searchParams.get('resource');
	const userId = url.searchParams.get('user');
	const startDate = url.searchParams.get('start_date');
	const endDate = url.searchParams.get('end_date');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	
	// Build filter object
	const filters = { limit };
	if (resourceId) filters.resourceId = resourceId;
	if (userId) filters.userId = userId;
	if (startDate) filters.startDate = startDate + ' 00:00:00';
	if (endDate) filters.endDate = endDate + ' 23:59:59';
	
	const logs = logDb.getAll(filters);
	
	// Get timezone setting
	const timezone = adminDb.getTimezone();
	
	return {
		logs,
		users,
		resources,
		timezone,
		filters: {
			resourceId,
			userId,
			startDate,
			endDate,
			limit
		}
	};
}
