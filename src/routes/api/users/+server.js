import { json } from '@sveltejs/kit';
import { resourceDb } from '$lib/database.js';

export async function GET({ url }) {
	try {
		const search = url.searchParams.get('search') || '';
		const users = resourceDb.searchUsers(search);
		return json(users);
	} catch (error) {
		console.error('Error fetching users:', error);
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	}
}
