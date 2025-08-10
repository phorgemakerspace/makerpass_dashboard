import { fail } from '@sveltejs/kit';
import { adminDb, settingsDb } from '$lib/database.js';

export async function load() {
	const admin = adminDb.getAdmin();
	const retentionSettings = adminDb.getRetentionSettings();
	const maintenanceThreshold = adminDb.getMaintenanceThreshold();
	const dataStats = adminDb.getDataStatistics();
	
	// Get Stripe settings
	const stripeSettings = {
		stripe_enabled: settingsDb.get('stripe_enabled') === 'true',
		stripe_webhook_secret: settingsDb.get('stripe_webhook_secret') || '',
		stripe_public_key: settingsDb.get('stripe_public_key') || '',
		stripe_secret_key: settingsDb.get('stripe_secret_key') || ''
	};
	
	return {
		apiKey: admin.api_key,
		adminId: admin.id,
		primaryColor: admin.primary_color || '#d25a2c',
		navigationColor: admin.navigation_color || '#2d2d2d',
		linkColor: admin.link_color || '#ffffff',
		logoColor: admin.logo_color || '#d25a2c',
		logoFontColor: admin.logo_font_color || '#ffffff',
		accessLogRetentionDays: retentionSettings.accessLogRetentionDays,
		maintenanceLogRetentionDays: retentionSettings.maintenanceLogRetentionDays,
		maintenanceThreshold: maintenanceThreshold,
		dataStatistics: dataStats,
		...stripeSettings
	};
}

export const actions = {
	regenerateApiKey: async ({ request }) => {
		const data = await request.formData();
		const adminId = data.get('admin_id');

		if (!adminId) {
			return fail(400, { error: 'Admin ID is required' });
		}

		try {
			adminDb.regenerateApiKey(adminId);
			return { success: true, message: 'API key regenerated successfully' };
		} catch (error) {
			console.error('Regenerate API key error:', error);
			return fail(500, { error: 'Failed to regenerate API key' });
		}
	},

	updatePrimaryColor: async ({ request }) => {
		const data = await request.formData();
		const primaryColor = data.get('primary_color');
		const adminId = data.get('admin_id');

		if (!primaryColor || !adminId) {
			return fail(400, { error: 'Primary color and admin ID are required' });
		}

		// Validate hex color format
		const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
		if (!hexColorRegex.test(primaryColor)) {
			return fail(400, { error: 'Primary color must be a valid hex color (e.g., #4f46e5)' });
		}

		try {
			adminDb.updatePrimaryColor(adminId, primaryColor);
			return { success: true, message: 'Primary color updated successfully' };
		} catch (error) {
			console.error('Update primary color error:', error);
			return fail(500, { error: 'Failed to update primary color' });
		}
	},

	updateNavigationColor: async ({ request }) => {
		const data = await request.formData();
		const navigationColor = data.get('navigation_color');
		const adminId = data.get('admin_id');

		if (!navigationColor || !adminId) {
			return fail(400, { error: 'Navigation color and admin ID are required' });
		}

		const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
		if (!hexColorRegex.test(navigationColor)) {
			return fail(400, { error: 'Navigation color must be a valid hex color (e.g., #ffffff)' });
		}

		try {
			adminDb.updateNavigationColor(adminId, navigationColor);
			return { success: true, message: 'Navigation color updated successfully' };
		} catch (error) {
			console.error('Update navigation color error:', error);
			return fail(500, { error: 'Failed to update navigation color' });
		}
	},

	updateLinkColor: async ({ request }) => {
		const data = await request.formData();
		const linkColor = data.get('link_color');
		const adminId = data.get('admin_id');

		if (!linkColor || !adminId) {
			return fail(400, { error: 'Link color and admin ID are required' });
		}

		const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
		if (!hexColorRegex.test(linkColor)) {
			return fail(400, { error: 'Link color must be a valid hex color (e.g., #4f46e5)' });
		}

		try {
			adminDb.updateLinkColor(adminId, linkColor);
			return { success: true, message: 'Link color updated successfully' };
		} catch (error) {
			console.error('Update link color error:', error);
			return fail(500, { error: 'Failed to update link color' });
		}
	},

	updateLogoFontColor: async ({ request }) => {
		const data = await request.formData();
		const logoFontColor = data.get('logo_font_color');
		const adminId = data.get('admin_id');

		if (!logoFontColor || !adminId) {
			return fail(400, { error: 'Logo font color and admin ID are required' });
		}

		const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
		if (!hexColorRegex.test(logoFontColor)) {
			return fail(400, { error: 'Logo font color must be a valid hex color (e.g., #333333)' });
		}

		try {
			adminDb.updateLogoFontColor(adminId, logoFontColor);
			return { success: true, message: 'Logo font color updated successfully' };
		} catch (error) {
			console.error('Update logo font color error:', error);
			return fail(500, { error: 'Failed to update logo font color' });
		}
	},

	updateRetentionSettings: async ({ request }) => {
		const data = await request.formData();
		const accessLogDays = parseInt(data.get('access_log_retention_days'));
		const maintenanceLogDays = parseInt(data.get('maintenance_log_retention_days'));
		const adminId = data.get('admin_id');

		if (!adminId || isNaN(accessLogDays) || isNaN(maintenanceLogDays)) {
			return fail(400, { error: 'Valid retention days and admin ID are required' });
		}

		if (accessLogDays < 1 || accessLogDays > 3650 || maintenanceLogDays < 1 || maintenanceLogDays > 3650) {
			return fail(400, { error: 'Retention days must be between 1 and 3650 (10 years)' });
		}

		try {
			adminDb.updateRetentionSettings(adminId, accessLogDays, maintenanceLogDays);
			return { success: true, message: 'Data retention settings updated successfully' };
		} catch (error) {
			console.error('Update retention settings error:', error);
			return fail(500, { error: 'Failed to update retention settings' });
		}
	},

	updateMaintenanceThreshold: async ({ request }) => {
		const data = await request.formData();
		const threshold = parseInt(data.get('maintenance_threshold'));
		const adminId = data.get('admin_id');

		if (!adminId || isNaN(threshold)) {
			return fail(400, { error: 'Valid maintenance threshold and admin ID are required' });
		}

		if (threshold < 1 || threshold > 100) {
			return fail(400, { error: 'Maintenance threshold must be between 1 and 100 percent' });
		}

		try {
			adminDb.updateMaintenanceThreshold(adminId, threshold);
			return { success: true, message: 'Maintenance threshold updated successfully' };
		} catch (error) {
			console.error('Update maintenance threshold error:', error);
			return fail(500, { error: 'Failed to update maintenance threshold' });
		}
	},

	cleanupOldData: async ({ request }) => {
		const data = await request.formData();
		const adminId = data.get('admin_id');

		if (!adminId) {
			return fail(400, { error: 'Admin ID is required' });
		}

		try {
			const result = adminDb.cleanupAllOldData();
			return { 
				success: true, 
				message: `Cleanup completed: ${result.accessLogsDeleted} access logs and ${result.maintenanceEventsDeleted} maintenance events deleted`,
				cleanupResult: result
			};
		} catch (error) {
			console.error('Cleanup error:', error);
			return fail(500, { error: 'Failed to cleanup old data' });
		}
	},

	updateStripeSettings: async ({ request }) => {
		const data = await request.formData();
		const adminId = data.get('admin_id');

		if (!adminId) {
			return fail(400, { error: 'Admin ID is required' });
		}

		try {
			const stripeEnabled = data.get('stripe_enabled') === 'on';
			const webhookSecret = data.get('stripe_webhook_secret') || '';
			const publicKey = data.get('stripe_public_key') || '';
			const secretKey = data.get('stripe_secret_key') || '';

			// Update Stripe settings
			settingsDb.set('stripe_enabled', stripeEnabled.toString());
			settingsDb.set('stripe_webhook_secret', webhookSecret);
			settingsDb.set('stripe_public_key', publicKey);
			settingsDb.set('stripe_secret_key', secretKey);

			return { success: true, message: 'Stripe settings updated successfully' };
		} catch (error) {
			console.error('Update Stripe settings error:', error);
			return fail(500, { error: 'Failed to update Stripe settings' });
		}
	}
};
