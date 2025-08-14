import { fail } from '@sveltejs/kit';
import { adminDb, settingsDb, getDb } from '$lib/database.js';
import Stripe from 'stripe';

const STRIPE_API_VERSION = '2024-06-20';

function getStripeClient() {
	const secretKey = settingsDb.get('stripe_secret_key');
	if (!secretKey) return null;
	return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}

function generateTempRfid() {
	const chars = '0123456789ABCDEF';
	let result = 'TEMP';
	for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
	return result;
}

function formatAddress(address) {
	if (!address) return null;
	const parts = [];
	if (address.line1) parts.push(address.line1);
	if (address.line2) parts.push(address.line2);
	if (address.city) parts.push(address.city);
	if (address.state) parts.push(address.state);
	if (address.postal_code) parts.push(address.postal_code);
	if (address.country) parts.push(address.country);
	return parts.join(', ');
}

async function resolvePlanName(subscription, stripe) {
	const item = subscription?.items?.data?.[0];
	const price = item?.price;
	if (!price) return 'Unknown';
	if (price.nickname) return price.nickname;
	if (price.product && typeof price.product === 'object' && price.product.name) return price.product.name;
	// If we only have a product ID, fetch the product name (optional, requires Stripe client)
	if (price.product && typeof price.product === 'string' && stripe) {
		try {
			const product = await stripe.products.retrieve(price.product);
			if (product?.name) return product.name;
		} catch (e) {
			// ignore and fall back
		}
	}
	if (price.lookup_key) return price.lookup_key;
	if (price.id) return price.id;
	return 'Unknown';
}

export async function load() {
	const admin = adminDb.getAdmin();
	const retentionSettings = adminDb.getRetentionSettings();
	const maintenanceThreshold = adminDb.getMaintenanceThreshold();
	const timezone = adminDb.getTimezone();
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
		timezone: timezone,
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
	},

	updateTimezone: async ({ request }) => {
		const data = await request.formData();
		const timezone = data.get('timezone');
		const adminId = data.get('admin_id');

		if (!timezone || !adminId) {
			return fail(400, { error: 'Timezone and admin ID are required' });
		}

		try {
			adminDb.updateTimezone(adminId, timezone);
			return { success: true, message: 'Timezone updated successfully' };
		} catch (error) {
			console.error('Update timezone error:', error);
			return fail(500, { error: 'Failed to update timezone' });
		}
	},

	// Sync existing Stripe customers/subscriptions into local users table
	syncStripeUsers: async ({ request }) => {
		const data = await request.formData();
		const adminId = data.get('admin_id');
		if (!adminId) {
			return fail(400, { error: 'Admin ID is required' });
		}

		const stripe = getStripeClient();
		if (!stripe) {
			return fail(400, { error: 'Stripe secret key is not configured' });
		}

		const db = getDb();
		let created = 0;
		let updated = 0;
		let disabled = 0;
		let processed = 0;

		try {
			// Iterate across relevant statuses to ensure we pull everything
			const statuses = ['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'];
			const seenSubs = new Set();
			for (const statusFilter of statuses) {
				let starting_after = undefined;
				while (true) {
					const page = await stripe.subscriptions.list({
						limit: 100,
						starting_after,
						status: statusFilter,
						expand: ['data.customer', 'data.items.data.price']
					});

					for (const sub of page.data) {
						if (seenSubs.has(sub.id)) continue;
						seenSubs.add(sub.id);
					processed++;
					const customer = sub.customer;
					const stripeCustomer = typeof customer === 'object' ? customer : await stripe.customers.retrieve(customer);
					if (!stripeCustomer || ('deleted' in stripeCustomer && stripeCustomer.deleted)) continue;

					const planName = await resolvePlanName(sub, stripe);
					const expiresIso = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
					const status = sub.status;
					const enableUser = status === 'active' || status === 'trialing' ? 1 : 0;

					let user = db.prepare('SELECT * FROM users WHERE customer_id = ?').get(stripeCustomer.id);
					if (!user && stripeCustomer.email) {
						user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(stripeCustomer.email);
					}

					if (user) {
						// Update existing user to be managed by Stripe
						const stripeName = stripeCustomer.name || null;
						const stripeEmail = stripeCustomer.email || null;
						db.prepare(`
							UPDATE users
							SET customer_id = ?,
								name = COALESCE(?, name),
								email = COALESCE(?, email),
								subscription_type = ?,
								subscription_expires = ?,
								enabled = ?,
								address = COALESCE(?, address),
								updated_at = CURRENT_TIMESTAMP
							WHERE id = ?
						`).run(
							stripeCustomer.id,
							stripeName,
							stripeEmail,
							planName,
							expiresIso,
							enableUser,
							formatAddress(stripeCustomer.address),
							user.id
						);
						updated++;
					} else if (stripeCustomer.email) {
						// Create a new user from Stripe customer
						db.prepare(`
							INSERT INTO users (name, email, rfid, customer_id, subscription_type, subscription_expires, enabled, address)
							VALUES (?, ?, ?, ?, ?, ?, ?, ?)
						`).run(
							stripeCustomer.name || (stripeCustomer.email.split('@')[0]),
							stripeCustomer.email,
							generateTempRfid(),
							stripeCustomer.id,
							planName,
							expiresIso,
							enableUser,
							formatAddress(stripeCustomer.address)
						);
						created++;
					}

					// If subscription is canceled, ensure user is disabled
					if (status === 'canceled') {
						const res = db.prepare('UPDATE users SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?').run(stripeCustomer.id);
						if (res.changes > 0) disabled += res.changes;
					}
					}

					if (page.has_more) {
						starting_after = page.data[page.data.length - 1].id;
					} else {
						break;
					}
				}
			}

			return {
				success: true,
				message: `Sync complete. Processed ${processed} subscriptions: ${created} created, ${updated} updated, ${disabled} disabled.`,
				stats: { processed, created, updated, disabled }
			};
		} catch (error) {
			console.error('Sync Stripe users error:', error);
			return fail(500, { error: 'Failed to sync Stripe users' });
		}
	}
};
