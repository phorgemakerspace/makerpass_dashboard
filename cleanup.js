// Utility script for automated data cleanup
// This can be run via cron job or scheduled task

import { adminDb } from './src/lib/database.js';

function runCleanup() {
	console.log('Starting automated data cleanup...');
	console.log('Timestamp:', new Date().toISOString());
	
	try {
		const result = adminDb.cleanupAllOldData();
		
		console.log('Cleanup completed successfully:');
		console.log(`- Access logs deleted: ${result.accessLogsDeleted}`);
		console.log(`- Maintenance events deleted: ${result.maintenanceEventsDeleted}`);
		console.log(`- Total records deleted: ${result.totalDeleted}`);
		
		if (result.totalDeleted > 0) {
			console.log('✅ Data cleanup completed with deletions');
		} else {
			console.log('✅ No old data found to cleanup');
		}
		
	} catch (error) {
		console.error('❌ Cleanup failed:', error);
		process.exit(1);
	}
}

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runCleanup();
}

export { runCleanup };
