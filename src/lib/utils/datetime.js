/**
 * Date/time utility functions with timezone support
 */

/**
 * Format a timestamp with timezone support
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} timezone - The timezone to display in (e.g., 'America/New_York')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateTime(timestamp, timezone = 'America/New_York', options = {}) {
	if (!timestamp) return '';
	
	const date = new Date(timestamp);
	
	const defaultOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		timeZone: timezone,
		timeZoneName: 'short'
	};
	
	const formatOptions = { ...defaultOptions, ...options };
	
	try {
		return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
	} catch (error) {
		console.warn('Failed to format date with timezone:', error);
		// Fallback to local time
		return date.toLocaleString();
	}
}

/**
 * Format a timestamp as a short date (mm/dd/yyyy format)
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} timezone - The timezone to display in
 * @returns {string} Formatted date string
 */
export function formatDateTimeShort(timestamp, timezone = 'America/New_York') {
	return formatDateTime(timestamp, timezone, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZoneName: undefined  // Explicitly remove timezone display
	});
}

/**
 * Format a timestamp as just the date (mm/dd/yyyy format)
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} timezone - The timezone to display in
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp, timezone = 'America/New_York') {
	return formatDateTime(timestamp, timezone, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

/**
 * Get the current timezone setting from the server
 * This would be called from the load function to get the timezone
 * For now, we'll export a function that accepts timezone as parameter
 */
export function createDateFormatter(timezone = 'America/New_York') {
	return {
		formatDateTime: (timestamp, options = {}) => formatDateTime(timestamp, timezone, options),
		formatDateTimeShort: (timestamp) => formatDateTimeShort(timestamp, timezone),
		formatDate: (timestamp) => formatDate(timestamp, timezone)
	};
}
