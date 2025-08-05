import { fail } from '@sveltejs/kit';
import { adminDb } from '$lib/database.js';

export async function load() {
	const admin = adminDb.getAdmin();
	
	return {
		apiKey: admin.api_key,
		adminId: admin.id,
		primaryColor: admin.primary_color || '#d25a2c',
		navigationColor: admin.navigation_color || '#2d2d2d',
		linkColor: admin.link_color || '#ffffff',
		logoColor: admin.logo_color || '#d25a2c',
		logoFontColor: admin.logo_font_color || '#ffffff'
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
	}
};
