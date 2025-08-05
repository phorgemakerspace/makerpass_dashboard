import Database from 'better-sqlite3';
import { dev } from '$app/environment';
import crypto from 'crypto';

const DB_PATH = process.env.DB_PATH || './makerpass.db';

let db;

export function getDb() {
	if (!db) {
		db = new Database(DB_PATH);
		db.pragma('journal_mode = WAL');
		initializeDatabase();
	}
	return db;
}

function initializeDatabase() {
	// Create tables
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			rfid TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS resources (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			resource_id TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			type TEXT NOT NULL CHECK (type IN ('door', 'machine')),
			card_present_required BOOLEAN DEFAULT FALSE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS user_resources (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			resource_id INTEGER NOT NULL,
			granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
			FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
			UNIQUE(user_id, resource_id)
		);

		CREATE TABLE IF NOT EXISTS access_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER,
			resource_id INTEGER NOT NULL,
			rfid TEXT NOT NULL,
			success BOOLEAN NOT NULL,
			reason TEXT NOT NULL,
			timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
			FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS admin (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			api_key TEXT UNIQUE NOT NULL,
			primary_color TEXT DEFAULT '#d25a2c',
			navigation_color TEXT DEFAULT '#2d2d2d',
			link_color TEXT DEFAULT '#ffffff',
			logo_color TEXT DEFAULT '#d25a2c',
			logo_font_color TEXT DEFAULT '#ffffff',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs (timestamp);
		CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON access_logs (resource_id);
		CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs (user_id);
		CREATE INDEX IF NOT EXISTS idx_users_rfid ON users (rfid);
		CREATE INDEX IF NOT EXISTS idx_resources_resource_id ON resources (resource_id);
	`);

	// Add color columns to existing admin table if they don't exist
	try {
		db.prepare("ALTER TABLE admin ADD COLUMN primary_color TEXT DEFAULT '#d25a2c'").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE admin ADD COLUMN navigation_color TEXT DEFAULT '#2d2d2d'").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE admin ADD COLUMN link_color TEXT DEFAULT '#ffffff'").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE admin ADD COLUMN logo_color TEXT DEFAULT '#d25a2c'").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE admin ADD COLUMN logo_font_color TEXT DEFAULT '#ffffff'").run();
	} catch (error) {
		// Column already exists, ignore the error
	}

	// Check if admin user exists - don't create default credentials
}

export function generateResourceId() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export function generateApiKey() {
	return crypto.randomBytes(32).toString('hex');
}

export function hashPassword(password) {
	return crypto.pbkdf2Sync(password, 'makerpass-salt', 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password, hash) {
	const newHash = hashPassword(password);
	return newHash === hash;
}

// Database operations for users
export const userDb = {
	getAll() {
		const db = getDb();
		return db.prepare('SELECT * FROM users ORDER BY name').all();
	},

	getById(id) {
		const db = getDb();
		return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
	},

	getByRfid(rfid) {
		const db = getDb();
		return db.prepare('SELECT * FROM users WHERE rfid = ?').get(rfid);
	},

	create(user) {
		const db = getDb();
		const stmt = db.prepare('INSERT INTO users (name, rfid, email) VALUES (?, ?, ?)');
		return stmt.run(user.name, user.rfid, user.email);
	},

	update(id, user) {
		const db = getDb();
		const stmt = db.prepare('UPDATE users SET name = ?, rfid = ?, email = ? WHERE id = ?');
		return stmt.run(user.name, user.rfid, user.email, id);
	},

	delete(id) {
		const db = getDb();
		const stmt = db.prepare('DELETE FROM users WHERE id = ?');
		return stmt.run(id);
	}
};

// Database operations for resources
export const resourceDb = {
	getAll() {
		const db = getDb();
		return db.prepare('SELECT * FROM resources ORDER BY type, name').all();
	},

	getById(id) {
		const db = getDb();
		return db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
	},

	getByResourceId(resourceId) {
		const db = getDb();
		return db.prepare('SELECT * FROM resources WHERE resource_id = ?').get(resourceId);
	},

	create(resource) {
		const db = getDb();
		const resourceId = generateResourceId();
		const stmt = db.prepare('INSERT INTO resources (resource_id, name, type, card_present_required) VALUES (?, ?, ?, ?)');
		return { ...stmt.run(resourceId, resource.name, resource.type, resource.card_present_required ? 1 : 0), resourceId };
	},

	update(id, resource) {
		const db = getDb();
		const stmt = db.prepare('UPDATE resources SET name = ?, type = ?, card_present_required = ? WHERE id = ?');
		return stmt.run(resource.name, resource.type, resource.card_present_required ? 1 : 0, id);
	},

	delete(id) {
		const db = getDb();
		const stmt = db.prepare('DELETE FROM resources WHERE id = ?');
		return stmt.run(id);
	}
};

// Database operations for user-resource permissions
export const permissionDb = {
	getUserPermissions(userId) {
		const db = getDb();
		return db.prepare(`
			SELECT r.* FROM resources r
			JOIN user_resources ur ON r.id = ur.resource_id
			WHERE ur.user_id = ?
		`).all(userId);
	},

	getResourceUsers(resourceId) {
		const db = getDb();
		return db.prepare(`
			SELECT u.* FROM users u
			JOIN user_resources ur ON u.id = ur.user_id
			WHERE ur.resource_id = ?
		`).all(resourceId);
	},

	grant(userId, resourceId) {
		const db = getDb();
		const stmt = db.prepare('INSERT OR IGNORE INTO user_resources (user_id, resource_id) VALUES (?, ?)');
		return stmt.run(userId, resourceId);
	},

	revoke(userId, resourceId) {
		const db = getDb();
		const stmt = db.prepare('DELETE FROM user_resources WHERE user_id = ? AND resource_id = ?');
		return stmt.run(userId, resourceId);
	},

	hasAccess(userId, resourceId) {
		const db = getDb();
		const result = db.prepare('SELECT COUNT(*) as count FROM user_resources WHERE user_id = ? AND resource_id = ?').get(userId, resourceId);
		return result.count > 0;
	}
};

// Database operations for access logs
export const logDb = {
	getAll(filters = {}) {
		const db = getDb();
		let query = `
			SELECT 
				al.id,
				al.rfid,
				al.success,
				al.reason,
				al.timestamp,
				u.name as user_name,
				u.email as user_email,
				r.resource_id,
				r.name as resource_name,
				r.type as resource_type
			FROM access_logs al
			LEFT JOIN users u ON al.user_id = u.id
			JOIN resources r ON al.resource_id = r.id
			WHERE 1=1
		`;
		const params = [];

		if (filters.resourceId) {
			query += ' AND r.id = ?';
			params.push(filters.resourceId);
		}

		if (filters.userId) {
			query += ' AND u.id = ?';
			params.push(filters.userId);
		}

		if (filters.startDate) {
			query += ' AND al.timestamp >= ?';
			params.push(filters.startDate);
		}

		if (filters.endDate) {
			query += ' AND al.timestamp <= ?';
			params.push(filters.endDate);
		}

		query += ' ORDER BY al.timestamp DESC LIMIT ?';
		params.push(filters.limit || 100);

		return db.prepare(query).all(...params);
	},

	create(log) {
		const db = getDb();
		const stmt = db.prepare('INSERT INTO access_logs (user_id, resource_id, rfid, success, reason) VALUES (?, ?, ?, ?, ?)');
		return stmt.run(log.user_id, log.resource_id, log.rfid, log.success ? 1 : 0, log.reason);
	}
};

// Admin operations
export const adminDb = {
	needsSetup() {
		const db = getDb();
		const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin').get();
		return adminExists.count === 0;
	},

	createInitialAdmin(username, password) {
		const db = getDb();
		const apiKey = generateApiKey();
		const passwordHash = hashPassword(password);
		
		const stmt = db.prepare(`
			INSERT INTO admin (username, password_hash, api_key) 
			VALUES (?, ?, ?)
		`);
		stmt.run(username, passwordHash, apiKey);
		
		console.log('Initial admin user created:');
		console.log('Username:', username);
		console.log('API Key:', apiKey);
		
		return { username, apiKey };
	},

	verifyApiKey(apiKey) {
		const db = getDb();
		return db.prepare('SELECT * FROM admin WHERE api_key = ?').get(apiKey);
	},

	verifyLogin(username, password) {
		const db = getDb();
		const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
		if (admin && verifyPassword(password, admin.password_hash)) {
			return admin;
		}
		return null;
	},

	updatePassword(id, newPassword) {
		const db = getDb();
		const passwordHash = hashPassword(newPassword);
		const stmt = db.prepare('UPDATE admin SET password_hash = ? WHERE id = ?');
		return stmt.run(passwordHash, id);
	},

	regenerateApiKey(id) {
		const db = getDb();
		const newApiKey = generateApiKey();
		const stmt = db.prepare('UPDATE admin SET api_key = ? WHERE id = ?');
		stmt.run(newApiKey, id);
		return newApiKey;
	},

	getAdmin() {
		const db = getDb();
		return db.prepare('SELECT * FROM admin LIMIT 1').get();
	},

	updatePrimaryColor(id, primaryColor) {
		const db = getDb();
		const stmt = db.prepare('UPDATE admin SET primary_color = ? WHERE id = ?');
		return stmt.run(primaryColor, id);
	},

	updateThemeColors(id, colors) {
		const db = getDb();
		const stmt = db.prepare(`
			UPDATE admin SET 
				primary_color = ?, 
				navigation_color = ?, 
				link_color = ?, 
				logo_color = ?,
				logo_font_color = ? 
			WHERE id = ?
		`);
		return stmt.run(
			colors.primary_color,
			colors.navigation_color,
			colors.link_color,
			colors.logo_color,
			colors.logo_font_color,
			id
		);
	},

	updateNavigationColor(id, navigationColor) {
		const db = getDb();
		const stmt = db.prepare('UPDATE admin SET navigation_color = ? WHERE id = ?');
		return stmt.run(navigationColor, id);
	},

	updateLinkColor(id, linkColor) {
		const db = getDb();
		const stmt = db.prepare('UPDATE admin SET link_color = ? WHERE id = ?');
		return stmt.run(linkColor, id);
	},

	updateLogoColor(id, logoColor) {
		const db = getDb();
		const stmt = db.prepare('UPDATE admin SET logo_color = ? WHERE id = ?');
		return stmt.run(logoColor, id);
	},

	updateLogoFontColor(id, logoFontColor) {
		const db = getDb();
		const stmt = db.prepare('UPDATE admin SET logo_font_color = ? WHERE id = ?');
		return stmt.run(logoFontColor, id);
	}
};
