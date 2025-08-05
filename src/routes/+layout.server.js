import { requireAuth } from '$lib/auth.js';
import { adminDb } from '$lib/database.js';
import { redirect } from '@sveltejs/kit';

export function load({ cookies, url }) {
	// Check if setup is needed
	if (adminDb.needsSetup() && url.pathname !== '/setup') {
		throw redirect(303, '/setup');
	}
	
	// Skip auth check for login and setup pages
	if (url.pathname !== '/login' && url.pathname !== '/setup') {
		requireAuth(cookies);
		
		// Load theme settings for authenticated pages
		const admin = adminDb.getAdmin();
		return {
			primaryColor: admin?.primary_color || '#d25a2c',
			navigationColor: admin?.navigation_color || '#2d2d2d',
			linkColor: admin?.link_color || '#ffffff',
			logoColor: admin?.logo_color || '#d25a2c',
			logoFontColor: admin?.logo_font_color || '#ffffff'
		};
	}
	
	return {};
}
