import { userDb, resourceDb, logDb, maintenanceDb, adminDb } from '$lib/database.js';

export async function load() {
	const users = userDb.getAll();
	const resources = resourceDb.getAll();
	const recentLogs = logDb.getAll({ limit: 10 });
	const activeSessions = logDb.getAllActiveSessions();
	const maintenanceAlerts = maintenanceDb.getAllMaintenanceAlerts();
	
	// Count resources by type
	const doors = resources.filter(r => r.type === 'door').length;
	const machines = resources.filter(r => r.type === 'machine').length;
	const onlineResources = resources.filter(r => r.connection_status === 'online').length;
	
	// Count successful vs failed access attempts today
	const today = new Date().toISOString().split('T')[0];
	const todayLogs = logDb.getAll({ startDate: today + ' 00:00:00', endDate: today + ' 23:59:59', limit: 1000 });
	const successfulToday = todayLogs.filter(log => log.success).length;
	const failedToday = todayLogs.filter(log => !log.success).length;

	// Get timezone setting
	const timezone = adminDb.getTimezone();

	return {
		stats: {
			totalUsers: users.length,
			totalResources: resources.length,
			doors,
			machines,
			onlineResources,
			successfulToday,
			failedToday,
			activeSessions: activeSessions.length
		},
		resources,
		recentLogs,
		activeSessions,
		maintenanceAlerts,
		timezone
	};
}
