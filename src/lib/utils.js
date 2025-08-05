/**
 * Utility functions for the MakerPass Dashboard
 */

/**
 * Format a timestamp to a human-readable date and time string
 * @param {string|number|Date} timestamp - The timestamp to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(timestamp) {
	return new Date(timestamp).toLocaleString();
}

/**
 * Format duration in minutes to a human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export function formatDuration(minutes) {
	if (!minutes) return '0 minutes';
	
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	
	if (hours === 0) return `${mins} minutes`;
	if (mins === 0) return `${hours} hours`;
	return `${hours}h ${mins}m`;
}
