import { error, json } from '@sveltejs/kit';
import { getDb, settingsDb } from '$lib/database.js';
import crypto from 'crypto';

export async function POST({ request }) {
	try {
		const body = await request.text();
		const signature = request.headers.get('stripe-signature');
		
		// Get webhook secret from settings
		const webhookSecret = settingsDb.get('stripe_webhook_secret');
		if (!webhookSecret) {
			console.error('Stripe webhook secret not configured');
			throw error(400, 'Webhook not configured');
		}

		// Verify the webhook signature (Stripe format: t=timestamp,v1=signature)
		if (!signature) {
			console.error('No signature provided');
			throw error(401, 'No signature');
		}

		const elements = signature.split(',');
		const timestamp = elements.find(e => e.startsWith('t='))?.substring(2);
		const providedSignature = elements.find(e => e.startsWith('v1='))?.substring(3);

		if (!timestamp || !providedSignature) {
			console.error('Invalid signature format');
			throw error(401, 'Invalid signature format');
		}

		// Check timestamp tolerance (5 minutes = 300 seconds) - skip in development
		const currentTime = Math.floor(Date.now() / 1000);
		const webhookTime = parseInt(timestamp);
		const timeDifference = Math.abs(currentTime - webhookTime);
		
		// Skip timestamp check if webhook secret contains 'development' 
		if (!webhookSecret.includes('development') && timeDifference > 300) {
			console.error(`Webhook timestamp too old: ${timeDifference} seconds`);
			throw error(401, 'Request timestamp too old');
		}

		// Create the signed payload
		const signedPayload = timestamp + '.' + body;
		
		// Generate expected signature
		const expectedSignature = crypto
			.createHmac('sha256', webhookSecret)
			.update(signedPayload, 'utf8')
			.digest('hex');
		
		if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))) {
			console.error('Invalid webhook signature');
			console.error('Expected:', expectedSignature);
			console.error('Received:', providedSignature);
			throw error(401, 'Invalid signature');
		}

		const event = JSON.parse(body);
		const db = getDb();

		console.log(`Received Stripe webhook: ${event.type}`);
		console.log('Event data:', JSON.stringify(event.data, null, 2));

		// Handle different webhook events
		switch (event.type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated':
				await handleSubscriptionEvent(event.data.object, db);
				break;
			
			case 'customer.subscription.deleted':
				await handleSubscriptionCanceled(event.data.object, db);
				break;
			
			case 'customer.created':
			case 'customer.updated':
				await handleCustomerEvent(event.data.object, db);
				break;
			
			case 'invoice.payment_succeeded':
				await handlePaymentSucceeded(event.data.object, db);
				break;
			
			case 'invoice.payment_failed':
				await handlePaymentFailed(event.data.object, db);
				break;
			
			default:
				console.log(`Unhandled webhook event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (err) {
		console.error('Webhook error:', err);
		console.error('Error stack:', err.stack);
		throw error(400, 'Webhook processing failed');
	}
}

async function handleSubscriptionEvent(subscription, db) {
	console.log('Handling subscription event for customer:', subscription.customer);
	const customerId = subscription.customer;
	
	// Get subscription details
	const subscriptionItem = subscription.items.data[0];
	const subscriptionType = subscriptionItem?.price?.nickname || 
							 subscriptionItem?.price?.lookup_key ||
							 subscriptionItem?.price?.id ||
							 'Unknown';
	
	const subscriptionExpires = new Date(subscription.current_period_end * 1000).toISOString();
	const status = subscription.status;
	
	console.log('Processing subscription:', { customerId, subscriptionType, subscriptionExpires, status });

	try {
		// First, get customer details from Stripe to get email
		const customer = await getStripeCustomer(customerId);
		if (!customer) {
			console.error(`Could not find customer ${customerId}`);
			return;
		}

		// Check if user already exists
		let user = db.prepare('SELECT * FROM users WHERE customer_id = ?').get(customerId);
		
		if (!user && customer.email) {
			// Check if user exists by email
			user = db.prepare('SELECT * FROM users WHERE email = ?').get(customer.email);
		}

		if (user) {
			// Update existing user
			db.prepare(`
				UPDATE users 
				SET customer_id = ?, subscription_type = ?, subscription_expires = ?, 
					enabled = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).run(
				customerId,
				subscriptionType,
				subscriptionExpires,
				status === 'active' ? 1 : 0,
				user.id
			);
			
			console.log(`Updated user ${user.id} with subscription ${subscription.id}`);
		} else if (customer.email && customer.name) {
			// Create new user from Stripe customer data
			const result = db.prepare(`
				INSERT INTO users (name, email, rfid, customer_id, subscription_type, subscription_expires, enabled, address)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`).run(
				customer.name,
				customer.email,
				generateTempRfid(), // Generate temporary RFID that will need to be updated
				customerId,
				subscriptionType,
				subscriptionExpires,
				status === 'active' ? 1 : 0,
				formatAddress(customer.address)
			);
			
			console.log(`Created new user ${result.lastInsertRowid} from Stripe subscription`);
		}
	} catch (err) {
		console.error('Error handling subscription event:', err);
		throw err;
	}
}

async function handleSubscriptionCanceled(subscription, db) {
	const customerId = subscription.customer;
	
	try {
		// Disable user when subscription is canceled
		const result = db.prepare(`
			UPDATE users 
			SET enabled = 0, subscription_type = NULL, subscription_expires = NULL, updated_at = CURRENT_TIMESTAMP
			WHERE customer_id = ?
		`).run(customerId);
		
		if (result.changes > 0) {
			console.log(`Disabled user with customer_id ${customerId} due to subscription cancellation`);
		}
	} catch (err) {
		console.error('Error handling subscription cancellation:', err);
		throw err;
	}
}

async function handleCustomerEvent(customer, db) {
	try {
		// Update user information when customer details change
		const result = db.prepare(`
			UPDATE users 
			SET name = ?, address = ?, updated_at = CURRENT_TIMESTAMP
			WHERE customer_id = ?
		`).run(
			customer.name || '',
			formatAddress(customer.address),
			customer.id
		);
		
		if (result.changes > 0) {
			console.log(`Updated customer information for ${customer.id}`);
		}
	} catch (err) {
		console.error('Error handling customer event:', err);
		throw err;
	}
}

async function handlePaymentSucceeded(invoice, db) {
	// Ensure user is enabled when payment succeeds
	const customerId = invoice.customer;
	
	try {
		const result = db.prepare(`
			UPDATE users 
			SET enabled = 1, updated_at = CURRENT_TIMESTAMP
			WHERE customer_id = ?
		`).run(customerId);
		
		if (result.changes > 0) {
			console.log(`Enabled user with customer_id ${customerId} after successful payment`);
		}
	} catch (err) {
		console.error('Error handling payment success:', err);
		throw err;
	}
}

async function handlePaymentFailed(invoice, db) {
	// Optionally disable user when payment fails (depending on business logic)
	const customerId = invoice.customer;
	
	try {
		// For now, just log the failed payment - you might want to disable after multiple failures
		console.log(`Payment failed for customer ${customerId}`);
		// Uncomment to disable on payment failure:
		// const result = db.prepare('UPDATE users SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?').run(customerId);
	} catch (err) {
		console.error('Error handling payment failure:', err);
		throw err;
	}
}

// Helper function to get Stripe customer (you'll need to implement this with Stripe SDK)
async function getStripeCustomer(customerId) {
	// This is a placeholder - you'll need to implement actual Stripe API call
	// For now, return a mock customer to test the webhook structure
	return {
		id: customerId,
		email: 'webhook-test@example.com',
		name: 'Webhook Test User',
		address: {
			line1: '123 Main St',
			city: 'Anytown',
			state: 'CA',
			postal_code: '12345',
			country: 'US'
		}
	};
}

function generateTempRfid() {
	// Generate a temporary RFID that can be updated later
	// Format: TEMP + 4 random hex digits
	const chars = '0123456789ABCDEF';
	let result = 'TEMP';
	for (let i = 0; i < 4; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
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
