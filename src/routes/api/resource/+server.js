import { json } from '@sveltejs/kit';
import { verifyApiKey } from '$lib/auth.js';
import { resourceDb } from '$lib/database.js';

export async function GET({ request }) {
	// Verify API key
	const authResult = verifyApiKey(request);
	if (!authResult.valid) {
		return json({ error: authResult.error }, { status: 401 });
	}

	// Get required header
	const resourceId = request.headers.get('X-Resource-ID');

	if (!resourceId) {
		return json({ error: 'Missing required header: X-Resource-ID' }, { status: 400 });
	}

	try {
		// Find resource by resource ID
		const resource = resourceDb.getByResourceId(resourceId);
		
		if (!resource) {
			return json({ error: 'Resource not found' }, { status: 404 });
		}

		return json({
			resource_id: resource.resource_id,
			name: resource.name,
			card_present_required: Boolean(resource.card_present_required)
		});

	} catch (error) {
		console.error('Resource lookup error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
