import Database from 'better-sqlite3';
import crypto from 'crypto';

const DB_PATH = (typeof process !== 'undefined' && process.env?.DB_PATH) || './makerpass.db';
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

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
			enabled BOOLEAN DEFAULT TRUE,
			connection_status TEXT DEFAULT 'offline' CHECK (connection_status IN ('online', 'offline')),
			-- Machine-specific fields (NULL for doors)
			require_card_present BOOLEAN DEFAULT FALSE,
			category TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS maintenance_intervals (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			resource_id INTEGER NOT NULL,
			name TEXT DEFAULT 'Maintenance',
			description TEXT,
			interval_type TEXT NOT NULL CHECK (interval_type IN ('usage', 'time')),
			interval_value INTEGER NOT NULL, -- stored in minutes
			warning_threshold INTEGER DEFAULT 0, -- stored in minutes
			display_unit TEXT DEFAULT 'hours' CHECK (display_unit IN ('minutes', 'hours', 'days', 'weeks', 'months')),
			enabled BOOLEAN DEFAULT TRUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS maintenance_events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			resource_id INTEGER NOT NULL,
			interval_id INTEGER,
			interval_name TEXT,
			maintenance_type TEXT DEFAULT 'scheduled',
			maintenance_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			notes TEXT,
			performed_by INTEGER,
			FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
			FOREIGN KEY (interval_id) REFERENCES maintenance_intervals (id) ON DELETE SET NULL,
			FOREIGN KEY (performed_by) REFERENCES users (id) ON DELETE SET NULL
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
			access_granted BOOLEAN NOT NULL DEFAULT FALSE,
			reason TEXT NOT NULL,
			session_id TEXT,
			session_start DATETIME,
			session_end DATETIME,
			usage_minutes INTEGER DEFAULT 0,
			access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
			timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
			user_name TEXT,
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
			access_log_retention_days INTEGER DEFAULT 90,
			maintenance_log_retention_days INTEGER DEFAULT 180,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs (timestamp);
		CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON access_logs (resource_id);
		CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs (user_id);
		CREATE INDEX IF NOT EXISTS idx_access_logs_session ON access_logs (session_start, session_end);
		CREATE INDEX IF NOT EXISTS idx_users_rfid ON users (rfid);
		CREATE INDEX IF NOT EXISTS idx_resources_resource_id ON resources (resource_id);
		CREATE INDEX IF NOT EXISTS idx_resources_type ON resources (type);
		CREATE INDEX IF NOT EXISTS idx_maintenance_intervals_resource ON maintenance_intervals (resource_id);
		CREATE INDEX IF NOT EXISTS idx_maintenance_events_resource ON maintenance_events (resource_id);
	`);

	// Add new columns to existing resources table if they don't exist
	try {
		db.prepare("ALTER TABLE resources ADD COLUMN enabled BOOLEAN DEFAULT TRUE").run();
	} catch (error) {
		// Column already exists, ignore the error
	}

	// Add new retention columns to existing admin table if they don't exist
	try {
		db.prepare("ALTER TABLE admin ADD COLUMN access_log_retention_days INTEGER DEFAULT 90").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE admin ADD COLUMN maintenance_log_retention_days INTEGER DEFAULT 180").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE resources ADD COLUMN connection_status TEXT DEFAULT 'offline'").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE resources ADD COLUMN category TEXT").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	// Rename card_present_required to require_card_present for consistency
	try {
		db.prepare("ALTER TABLE resources RENAME COLUMN card_present_required TO require_card_present").run();
	} catch (error) {
		// Column might not exist or already renamed
	}
	
	// Add new columns to access_logs for session tracking and usage
	try {
		db.prepare("ALTER TABLE access_logs ADD COLUMN session_start DATETIME").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE access_logs ADD COLUMN session_end DATETIME").run();
	} catch (error) {
		// Column already exists, ignore the error
	}
	
	try {
		db.prepare("ALTER TABLE access_logs ADD COLUMN usage_minutes INTEGER DEFAULT 0").run();
	} catch (error) {
		// Column already exists, ignore the error
	}

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
		return db.prepare('SELECT * FROM resources ORDER BY type, category, name').all();
	},

	getAllByType(type) {
		const db = getDb();
		return db.prepare('SELECT * FROM resources WHERE type = ? ORDER BY category, name').all(type);
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
		const stmt = db.prepare(`
			INSERT INTO resources (resource_id, name, type, enabled, connection_status, require_card_present, category) 
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`);
		return { 
			...stmt.run(
				resourceId, 
				resource.name, 
				resource.type,
				resource.enabled !== false ? 1 : 0,
				resource.connection_status || 'offline',
				resource.require_card_present ? 1 : 0,
				resource.category || null
			), 
			resourceId 
		};
	},

	update(id, resource) {
		const db = getDb();
		const stmt = db.prepare(`
			UPDATE resources SET 
				name = ?, 
				type = ?, 
				enabled = ?, 
				connection_status = ?, 
				require_card_present = ?, 
				category = ?
			WHERE id = ?
		`);
		return stmt.run(
			resource.name, 
			resource.type,
			resource.enabled ? 1 : 0,
			resource.connection_status || 'offline',
			resource.require_card_present ? 1 : 0,
			resource.category || null,
			id
		);
	},

	updateStatus(id, enabled) {
		const db = getDb();
		const stmt = db.prepare('UPDATE resources SET enabled = ? WHERE id = ?');
		return stmt.run(enabled ? 1 : 0, id);
	},

	updateConnectionStatus(resourceId, status) {
		const db = getDb();
		const stmt = db.prepare('UPDATE resources SET connection_status = ? WHERE resource_id = ?');
		return stmt.run(status, resourceId);
	},

	delete(id) {
		const db = getDb();
		const stmt = db.prepare('DELETE FROM resources WHERE id = ?');
		return stmt.run(id);
	},

	getByCategory() {
		const db = getDb();
		const resources = db.prepare('SELECT * FROM resources ORDER BY type, category, name').all();
		
		const grouped = {
			doors: [],
			machines: {}
		};
		
		resources.forEach(resource => {
			if (resource.type === 'door') {
				grouped.doors.push(resource);
			} else if (resource.type === 'machine') {
				const category = resource.category || 'uncategorized';
				if (!grouped.machines[category]) {
					grouped.machines[category] = [];
				}
				grouped.machines[category].push(resource);
			}
		});
		
		return grouped;
	},

	getMaintenanceIntervals(resourceId) {
		const db = getDb();
		return db.prepare('SELECT * FROM maintenance_intervals WHERE resource_id = ? ORDER BY created_at').all(resourceId);
	},

	getMaintenanceEvents(resourceId, limit = 10) {
		const db = getDb();
		return db.prepare(`
			SELECT me.*, u.name as performed_by_name
			FROM maintenance_events me
			LEFT JOIN users u ON me.performed_by = u.id
			WHERE me.resource_id = ? 
			ORDER BY me.maintenance_date DESC 
			LIMIT ?
		`).all(resourceId, limit);
	},

	getAccessLogs(resourceId, limit = 20) {
		const db = getDb();
		return db.prepare(`
			SELECT 
				al.*,
				u.name as user_name_from_users
			FROM access_logs al
			LEFT JOIN users u ON al.user_id = u.id
			WHERE al.resource_id = ?
			ORDER BY al.access_time DESC, al.timestamp DESC
			LIMIT ?
		`).all(resourceId, limit);
	},

	searchUsers(search = '') {
		const db = getDb();
		if (!search.trim()) {
			return db.prepare(`
				SELECT id, name, email 
				FROM users 
				ORDER BY name 
				LIMIT 10
			`).all();
		}
		
		const searchTerm = `%${search.trim()}%`;
		return db.prepare(`
			SELECT id, name, email 
			FROM users 
			WHERE name LIKE ? OR email LIKE ?
			ORDER BY name 
			LIMIT 10
		`).all(searchTerm, searchTerm);
	}
};

// Database operations for maintenance intervals
export const maintenanceDb = {
	getIntervalsByResource(resourceId) {
		const db = getDb();
		return db.prepare('SELECT * FROM maintenance_intervals WHERE resource_id = ? ORDER BY created_at').all(resourceId);
	},

	createInterval(interval) {
		const db = getDb();
		const stmt = db.prepare(`
			INSERT INTO maintenance_intervals (
				resource_id, name, description, interval_type, interval_value, 
				warning_threshold, display_unit, enabled
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`);
		return stmt.run(
			interval.resource_id,
			interval.name || 'Maintenance',
			interval.description || '',
			interval.interval_type,
			interval.interval_value,
			interval.warning_threshold || 0,
			interval.display_unit || 'hours',
			interval.enabled !== false ? 1 : 0
		);
	},

	updateInterval(id, interval) {
		const db = getDb();
		const stmt = db.prepare(`
			UPDATE maintenance_intervals SET 
				name = ?, 
				description = ?,
				interval_type = ?, 
				interval_value = ?, 
				warning_threshold = ?,
				display_unit = ?, 
				enabled = ? 
			WHERE id = ?
		`);
		return stmt.run(
			interval.name || 'Maintenance',
			interval.description || '',
			interval.interval_type,
			interval.interval_value,
			interval.warning_threshold || 0,
			interval.display_unit || 'hours',
			interval.enabled !== false ? 1 : 0,
			id
		);
	},

	deleteInterval(id) {
		const db = getDb();
		const stmt = db.prepare('DELETE FROM maintenance_intervals WHERE id = ?');
		return stmt.run(id);
	},

	getMaintenanceEvents(resourceId) {
		const db = getDb();
		return db.prepare(`
			SELECT me.*, u.name as performed_by_name, mi.interval_type, mi.interval_value
			FROM maintenance_events me
			LEFT JOIN users u ON me.performed_by = u.id
			LEFT JOIN maintenance_intervals mi ON me.interval_id = mi.id
			WHERE me.resource_id = ?
			ORDER BY me.maintenance_date DESC
		`).all(resourceId);
	},

	createMaintenanceEvent(event) {
		const db = getDb();
		const now = new Date().toISOString();
		const stmt = db.prepare(`
			INSERT INTO maintenance_events (
				resource_id, 
				interval_id, 
				interval_name, 
				maintenance_type, 
				maintenance_date,
				notes, 
				performed_by
			) VALUES (?, ?, ?, ?, ?, ?, ?)
		`);
		return stmt.run(
			event.resource_id,
			event.interval_id || null,
			event.interval_name || null,
			event.maintenance_type || 'scheduled',
			now,
			event.notes || '',
			event.performed_by || null
		);
	},

	// Legacy method name for compatibility
	logMaintenanceEvent(resourceId, event) {
		return this.createMaintenanceEvent({
			resource_id: resourceId,
			...event
		});
	},

	getMaintenanceStatus(resourceId) {
		const db = getDb();
		
		// Get all enabled intervals for this resource
		const intervals = db.prepare(`
			SELECT * FROM maintenance_intervals 
			WHERE resource_id = ? AND enabled = 1
		`).all(resourceId);
		
		const status = [];
		
		for (const interval of intervals) {
			let progress = 0;
			let isOverdue = false;
			let nextDue = null;
			
			if (interval.interval_type === 'usage') {
				// Calculate usage-based maintenance
				const totalUsage = db.prepare(`
					SELECT COALESCE(SUM(usage_minutes), 0) as total 
					FROM access_logs 
					WHERE resource_id = ? AND usage_minutes > 0
				`).get(resourceId);
				
				const lastMaintenance = db.prepare(`
					SELECT MAX(maintenance_date) as last_maintenance 
					FROM maintenance_events 
					WHERE resource_id = ? AND interval_id = ?
				`).get(resourceId, interval.id);
				
				let usageSinceLastMaintenance = totalUsage.total;
				
				if (lastMaintenance.last_maintenance) {
					const usageSince = db.prepare(`
						SELECT COALESCE(SUM(usage_minutes), 0) as total 
						FROM access_logs 
						WHERE resource_id = ? AND timestamp > ? AND usage_minutes > 0
					`).get(resourceId, lastMaintenance.last_maintenance);
					usageSinceLastMaintenance = usageSince.total;
				}
				
				progress = (usageSinceLastMaintenance / interval.interval_value) * 100;
				isOverdue = usageSinceLastMaintenance >= interval.interval_value;
				
			} else if (interval.interval_type === 'time') {
				// Calculate time-based maintenance
				const lastMaintenance = db.prepare(`
					SELECT MAX(maintenance_date) as last_maintenance 
					FROM maintenance_events 
					WHERE resource_id = ? AND interval_id = ?
				`).get(resourceId, interval.id);
				
				const referenceDate = lastMaintenance.last_maintenance || 
					db.prepare('SELECT created_at FROM resources WHERE id = ?').get(resourceId).created_at;
				
				// Use UTC for consistent timezone handling
				const now = new Date();
				const reference = new Date(referenceDate + (referenceDate.includes('Z') ? '' : 'Z')); // Ensure UTC parsing
				const minutesSinceReference = Math.floor((now - reference) / (1000 * 60));
				
				progress = (minutesSinceReference / interval.interval_value) * 100;
				isOverdue = minutesSinceReference >= interval.interval_value;
				
				// Calculate next due date
				const nextDueDate = new Date(reference.getTime() + (interval.interval_value * 60 * 1000));
				nextDue = nextDueDate.toISOString();
			}
			
			status.push({
				interval_id: interval.id,
				type: interval.interval_type,
				value: interval.interval_value,
				display_unit: interval.display_unit,
				progress: Math.min(progress, 100),
				isOverdue,
				nextDue
			});
		}
		
		return status;
	},

	getAllMaintenanceAlerts() {
		const db = getDb();
		
		// Get all resources that have maintenance intervals
		const resources = db.prepare(`
			SELECT DISTINCT r.id, r.name, r.type, r.category
			FROM resources r
			JOIN maintenance_intervals mi ON r.id = mi.resource_id
			WHERE mi.enabled = 1 AND r.type = 'machine'
		`).all();
		
		const alerts = [];
		
		for (const resource of resources) {
			const maintenanceStatus = this.getMaintenanceStatus(resource.id);
			
			// Get intervals with their details for context
			const intervals = db.prepare(`
				SELECT * FROM maintenance_intervals 
				WHERE resource_id = ? AND enabled = 1
			`).all(resource.id);
			
			for (const status of maintenanceStatus) {
				const interval = intervals.find(i => i.id === status.interval_id);
				if (!interval) continue;
				
				const isWarning = status.progress >= (interval.warning_threshold || 80);
				
				if (status.isOverdue || isWarning) {
					alerts.push({
						resourceId: resource.id,
						resourceName: resource.name,
						resourceType: resource.type,
						resourceCategory: resource.category,
						intervalId: interval.id,
						intervalName: interval.name,
						description: interval.description,
						progress: status.progress,
						isOverdue: status.isOverdue,
						isWarning: isWarning && !status.isOverdue,
						nextDue: status.nextDue,
						displayUnit: interval.display_unit,
						intervalType: interval.interval_type
					});
				}
			}
		}
		
		// Sort by severity: overdue first, then warnings, then by progress descending
		alerts.sort((a, b) => {
			if (a.isOverdue && !b.isOverdue) return -1;
			if (!a.isOverdue && b.isOverdue) return 1;
			if (a.isWarning && !b.isWarning) return -1;
			if (!a.isWarning && b.isWarning) return 1;
			return b.progress - a.progress;
		});
		
		return alerts;
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
				al.access_granted,
				al.reason,
				al.session_id,
				al.session_start,
				al.session_end,
				al.usage_minutes,
				al.access_time,
				al.timestamp,
				al.user_name,
				u.name as user_name_from_users,
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
		const stmt = db.prepare(`
			INSERT INTO access_logs (
				user_id, resource_id, rfid, success, access_granted, reason, 
				session_id, session_start, session_end, usage_minutes, user_name
			) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
		return stmt.run(
			log.user_id || null,
			log.resource_id,
			log.rfid,
			log.success ? 1 : 0,
			log.access_granted || log.success || false,
			log.reason || '',
			log.session_id || null,
			log.session_start || null,
			log.session_end || null,
			log.usage_minutes || 0,
			log.user_name || null
		);
	},

	startSession(userId, resourceId, rfid) {
		const db = getDb();
		const stmt = db.prepare(`
			INSERT INTO access_logs (user_id, resource_id, rfid, success, reason, session_start) 
			VALUES (?, ?, ?, 1, 'Session started', ?)
		`);
		return stmt.run(userId, resourceId, rfid, new Date().toISOString());
	},

	endSession(logId, endTime = null, endingUserId = null) {
		const db = getDb();
		const endTimestamp = endTime || new Date().toISOString();
		
		// Get the session data to determine who started it
		const log = db.prepare('SELECT session_start, user_id FROM access_logs WHERE id = ?').get(logId);
		
		let usageMinutes = 0;
		if (log && log.session_start) {
			const start = new Date(log.session_start);
			const end = new Date(endTimestamp);
			usageMinutes = Math.floor((end - start) / (1000 * 60)); // Convert to minutes
		}
		
		// Determine reason based on who is ending the session
		let reason = 'Session ended'; // Default (forced termination)
		if (endingUserId && log && endingUserId === log.user_id) {
			reason = 'Session completed'; // Same user ending their own session
		}
		
		const stmt = db.prepare(`
			UPDATE access_logs SET 
				session_end = ?, 
				usage_minutes = ?, 
				reason = ?
			WHERE id = ?
		`);
		return stmt.run(endTimestamp, usageMinutes, reason, logId);
	},

	getActiveSession(resourceId) {
		const db = getDb();
		return db.prepare(`
			SELECT al.*, u.name as user_name, r.name as resource_name
			FROM access_logs al
			LEFT JOIN users u ON al.user_id = u.id
			JOIN resources r ON al.resource_id = r.id
			WHERE al.resource_id = ? AND al.session_start IS NOT NULL AND al.session_end IS NULL
			ORDER BY al.session_start DESC
			LIMIT 1
		`).get(resourceId);
	},

	getAllActiveSessions() {
		const db = getDb();
		return db.prepare(`
			SELECT al.*, u.name as user_name, r.name as resource_name, r.type as resource_type
			FROM access_logs al
			LEFT JOIN users u ON al.user_id = u.id
			JOIN resources r ON al.resource_id = r.id
			WHERE al.session_start IS NOT NULL AND al.session_end IS NULL
			ORDER BY al.session_start DESC
		`).all();
	},

	getTotalUsage(resourceId, since = null) {
		const db = getDb();
		let query = `
			SELECT COALESCE(SUM(usage_minutes), 0) as total_minutes
			FROM access_logs 
			WHERE resource_id = ? AND usage_minutes > 0
		`;
		const params = [resourceId];
		
		if (since) {
			query += ' AND timestamp >= ?';
			params.push(since);
		}
		
		return db.prepare(query).get(...params);
	},

	getRecentAccess(resourceId) {
		const db = getDb();
		return db.prepare(`
			SELECT al.*, u.name as user_name, r.name as resource_name
			FROM access_logs al
			LEFT JOIN users u ON al.user_id = u.id
			JOIN resources r ON al.resource_id = r.id
			WHERE al.resource_id = ? AND al.success = 1
			ORDER BY al.access_time DESC
			LIMIT 1
		`).get(resourceId);
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
	},

	// Data retention settings
	updateRetentionSettings(id, accessLogDays, maintenanceLogDays) {
		const db = getDb();
		const stmt = db.prepare(`
			UPDATE admin SET 
				access_log_retention_days = ?, 
				maintenance_log_retention_days = ? 
			WHERE id = ?
		`);
		return stmt.run(accessLogDays, maintenanceLogDays, id);
	},

	getRetentionSettings() {
		const db = getDb();
		const admin = db.prepare('SELECT access_log_retention_days, maintenance_log_retention_days FROM admin LIMIT 1').get();
		return {
			accessLogRetentionDays: admin?.access_log_retention_days || 90,
			maintenanceLogRetentionDays: admin?.maintenance_log_retention_days || 180
		};
	},

	// Cleanup functions
	cleanupOldAccessLogs(retentionDays = null) {
		const db = getDb();
		
		// Get retention setting if not provided
		if (retentionDays === null) {
			const settings = this.getRetentionSettings();
			retentionDays = settings.accessLogRetentionDays;
		}
		
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
		
		const stmt = db.prepare(`
			DELETE FROM access_logs 
			WHERE timestamp < ?
		`);
		
		const result = stmt.run(cutoffDate.toISOString());
		console.log(`Cleaned up ${result.changes} access logs older than ${retentionDays} days`);
		return result.changes;
	},

	cleanupOldMaintenanceEvents(retentionDays = null) {
		const db = getDb();
		
		// Get retention setting if not provided
		if (retentionDays === null) {
			const settings = this.getRetentionSettings();
			retentionDays = settings.maintenanceLogRetentionDays;
		}
		
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
		
		const stmt = db.prepare(`
			DELETE FROM maintenance_events 
			WHERE maintenance_date < ?
		`);
		
		const result = stmt.run(cutoffDate.toISOString());
		console.log(`Cleaned up ${result.changes} maintenance events older than ${retentionDays} days`);
		return result.changes;
	},

	cleanupAllOldData() {
		const accessDeleted = this.cleanupOldAccessLogs();
		const maintenanceDeleted = this.cleanupOldMaintenanceEvents();
		
		return {
			accessLogsDeleted: accessDeleted,
			maintenanceEventsDeleted: maintenanceDeleted,
			totalDeleted: accessDeleted + maintenanceDeleted
		};
	},

	// Get data usage statistics
	getDataStatistics() {
		const db = getDb();
		
		const stats = {
			accessLogs: {
				total: db.prepare('SELECT COUNT(*) as count FROM access_logs').get().count,
				last30Days: db.prepare(`
					SELECT COUNT(*) as count FROM access_logs 
					WHERE timestamp > datetime('now', '-30 days')
				`).get().count,
				last90Days: db.prepare(`
					SELECT COUNT(*) as count FROM access_logs 
					WHERE timestamp > datetime('now', '-90 days')
				`).get().count,
				oldest: db.prepare(`
					SELECT timestamp FROM access_logs 
					ORDER BY timestamp ASC LIMIT 1
				`).get()?.timestamp
			},
			maintenanceEvents: {
				total: db.prepare('SELECT COUNT(*) as count FROM maintenance_events').get().count,
				last30Days: db.prepare(`
					SELECT COUNT(*) as count FROM maintenance_events 
					WHERE maintenance_date > datetime('now', '-30 days')
				`).get().count,
				last180Days: db.prepare(`
					SELECT COUNT(*) as count FROM maintenance_events 
					WHERE maintenance_date > datetime('now', '-180 days')
				`).get().count,
				oldest: db.prepare(`
					SELECT maintenance_date FROM maintenance_events 
					ORDER BY maintenance_date ASC LIMIT 1
				`).get()?.maintenance_date
			},
			totalRecords: 0,
			databaseSize: this.getDatabaseSize()
		};
		
		stats.totalRecords = stats.accessLogs.total + stats.maintenanceEvents.total;
		
		return stats;
	},

	getDatabaseSize() {
		const db = getDb();
		try {
			const sizeResult = db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get();
			return sizeResult?.size || 0;
		} catch (error) {
			console.error('Error getting database size:', error);
			return 0;
		}
	}
};
