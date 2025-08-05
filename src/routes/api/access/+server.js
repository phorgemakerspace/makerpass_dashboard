import { json } from '@sveltejs/kit';
import { verifyApiKey } from '$lib/auth.js';
import { userDb, resourceDb, permissionDb, logDb } from '$lib/database.js';

export async function POST({ request }) {
	// Verify API key
	const authResult = verifyApiKey(request);
	if (!authResult.valid) {
		return json({ error: authResult.error }, { status: 401 });
	}

	// Get required headers
	const rfid = request.headers.get('X-RFID');
	const resourceId = request.headers.get('X-Resource-ID');

	if (!rfid || !resourceId) {
		return json({ error: 'Missing required headers: X-RFID and X-Resource-ID' }, { status: 400 });
	}

	try {
		// Find user by RFID
		const user = userDb.getByRfid(rfid);
		
		// Find resource by resource ID
		const resource = resourceDb.getByResourceId(resourceId);
		
		if (!resource) {
			// Log failed attempt - invalid resource (can't log without resource_id since it's required)
			// We'll just return the error without logging in this case
			return json({
				status: 'denied',
				reason: 'invalid_resource'
			});
		}

		if (!user) {
			// Log failed attempt - invalid RFID
			logDb.create({
				user_id: null,
				resource_id: resource.id,
				rfid: rfid,
				success: false,
				reason: 'invalid_rfid'
			});
			
			return json({
				status: 'denied',
				reason: 'invalid_rfid'
			});
		}

		// Check if user has access to this resource
		const hasAccess = permissionDb.hasAccess(user.id, resource.id);
		
		if (!hasAccess) {
			// Log failed attempt - access not permitted
			logDb.create({
				user_id: user.id,
				resource_id: resource.id,
				rfid: rfid,
				success: false,
				reason: 'access_not_permitted'
			});
			
			return json({
				status: 'denied',
				reason: 'access_not_permitted'
			});
		}

		// Log successful access
		logDb.create({
			user_id: user.id,
			resource_id: resource.id,
			rfid: rfid,
			success: true,
			reason: 'granted'
		});

		return json({
			status: 'granted',
			reason: 'granted'
		});

	} catch (error) {
		console.error('Access check error:', error);
		
		// Try to log error attempt, but only if we can find the resource
		try {
			const resource = resourceDb.getByResourceId(resourceId);
			if (resource) {
				const user = userDb.getByRfid(rfid);
				logDb.create({
					user_id: user?.id || null,
					resource_id: resource.id,
					rfid: rfid,
					success: false,
					reason: 'server_error'
				});
			}
		} catch (logError) {
			console.error('Failed to log error:', logError);
		}

		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
