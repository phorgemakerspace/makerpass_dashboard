<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	export let form;
	
	const { resource, maintenanceIntervals, maintenanceEvents, accessLogs } = data;
	
	let showAddModal = false;
	let showEditModal = false;
	let editingInterval = null;
	let newInterval = {
		name: '',
		description: '',
		interval_type: 'time',
		interval_value: 1,
		interval_unit: 'hours',
		warning_threshold: 0
	};

	function openAddModal() {
		newInterval = {
			name: '',
			description: '',
			interval_type: 'time',
			interval_value: 1,
			interval_unit: 'hours',
			warning_threshold: 0
		};
		showAddModal = true;
	}

	function openEditModal(interval) {
		// Use the stored display_unit to show the interval in the user's original format
		const displayUnit = interval.display_unit || 'hours';
		let displayValue = interval.interval_value;
		let displayWarning = 0; // Default to 0 if no warning
		
		// Convert from minutes back to the original unit
		switch (displayUnit) {
			case 'minutes':
				// Already in minutes
				if (interval.warning_threshold > 0) {
					displayWarning = interval.warning_threshold;
				}
				break;
			case 'hours':
				displayValue = interval.interval_value / 60;
				if (interval.warning_threshold > 0) {
					displayWarning = interval.warning_threshold / 60;
				}
				break;
			case 'days':
				displayValue = interval.interval_value / (60 * 24);
				if (interval.warning_threshold > 0) {
					displayWarning = interval.warning_threshold / (60 * 24);
				}
				break;
			case 'weeks':
				displayValue = interval.interval_value / (60 * 24 * 7);
				if (interval.warning_threshold > 0) {
					displayWarning = interval.warning_threshold / (60 * 24 * 7);
				}
				break;
			case 'months':
				displayValue = interval.interval_value / (60 * 24 * 30);
				if (interval.warning_threshold > 0) {
					displayWarning = interval.warning_threshold / (60 * 24 * 30);
				}
				break;
		}
		
		editingInterval = {
			...interval,
			interval_value: Math.round(displayValue), // Round to avoid floating point issues
			warning_threshold: Math.round(displayWarning),
			interval_unit: displayUnit
		};
		showEditModal = true;
	}

	function closeModals() {
		showAddModal = false;
		showEditModal = false;
		editingInterval = null;
	}
	
	// Format interval in the user's original input format
	function formatIntervalInOriginalUnit(minutes, displayUnit, isWarning = false) {
		if (!minutes || minutes === 0) {
			return isWarning ? 'No warning set' : '0 minutes';
		}
		
		if (!displayUnit) return '0 minutes';
		
		let value;
		let unit = displayUnit;
		
		switch (displayUnit) {
			case 'minutes':
				value = minutes;
				break;
			case 'hours':
				value = minutes / 60;
				break;
			case 'days':
				value = minutes / (60 * 24);
				break;
			case 'weeks':
				value = minutes / (60 * 24 * 7);
				break;
			case 'months':
				value = minutes / (60 * 24 * 30);
				break;
			default:
				value = minutes;
				unit = 'minutes';
		}
		
		// If the value is not a whole number, show one decimal place
		const displayValue = value % 1 === 0 ? value : value.toFixed(1);
		return `${displayValue} ${unit}`;
	}
	
	// Calculate time until next maintenance
	function getNextDueMessage(interval) {
		if (!interval.nextDue) {
			return 'No maintenance scheduled';
		}
		
		const now = new Date();
		const nextDue = new Date(interval.nextDue);
		const diffMs = nextDue - now;
		
		if (diffMs < 0) {
			// Overdue
			const overdueDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
			if (overdueDays === 0) {
				return 'Maintenance overdue';
			}
			return `Maintenance overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`;
		}
		
		// Calculate time remaining
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		
		if (diffDays > 0) {
			return `Next maintenance due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
		} else if (diffHours > 0) {
			return `Next maintenance due in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
		} else {
			return 'Maintenance due soon';
		}
	}
	
	// Get progress bar color based on progress percentage
	function getProgressColor(progress, isOverdue) {
		if (isOverdue) return 'bg-red-500';
		if (progress >= 80) return 'bg-yellow-500';
		return 'bg-green-500';
	}
	
	function formatDuration(minutes) {
		if (!minutes) return '0 minutes';
		
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		
		if (hours === 0) return `${mins} minutes`;
		if (mins === 0) return `${hours} hours`;
		return `${hours}h ${mins}m`;
	}
	
	function formatDateTime(timestamp) {
		return new Date(timestamp).toLocaleString();
	}
	
	function getConnectionStatusColor(status) {
		return status === 'online' ? 'text-green-600' : 'text-gray-400';
	}
	
	function getConnectionStatusIcon(status) {
		return status === 'online' ? '●' : '○';
	}
	
	// Calculate usage statistics for doors
	function getUsageStats(logs) {
		const now = new Date();
		
		// Get start of today (00:00:00 local time)
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		// Get 7 days ago from start of today
		const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago + today = 7 days
		
		// Get first day of current month
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		
		const successfulAccess = logs.filter(log => log.access_granted);
		
		const todayCount = successfulAccess.filter(log => {
			const logDate = new Date(log.access_time);
			const logDateStart = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
			return logDateStart.getTime() === todayStart.getTime();
		}).length;
		
		const weekCount = successfulAccess.filter(log => {
			const logDate = new Date(log.access_time);
			const logDateStart = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
			return logDateStart >= weekStart;
		}).length;
		
		const monthCount = successfulAccess.filter(log => {
			const logDate = new Date(log.access_time);
			return logDate >= monthStart;
		}).length;
		
		return {
			today: todayCount,
			week: weekCount,
			month: monthCount
		};
	}
</script>

<svelte:head>
	<title>{resource.name} - Resource Details</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		{#if form?.error}
			<div class="mb-4 rounded-md bg-red-50 p-4">
				<div class="text-sm text-red-700">
					{form.error}
				</div>
			</div>
		{/if}

		{#if form?.success}
			<div class="mb-4 rounded-md bg-green-50 p-4">
				<div class="text-sm text-green-700">
					{form.message}
				</div>
			</div>
		{/if}

		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<nav class="mb-4">
				<a href="/resources" class="text-blue-600 hover:text-blue-800">← Back to Resources</a>
			</nav>
			
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
				<div>
					<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
						{resource.name}
					</h1>
					<p class="text-gray-600 mt-2 text-sm sm:text-base">
						{resource.type === 'door' ? 'Door' : `Machine - ${resource.category || 'Uncategorized'}`}
					</p>
				</div>
				<div class="flex items-center space-x-4">
					<span class="{getConnectionStatusColor(resource.connection_status)} text-lg flex items-center" title="Connection Status">
						{getConnectionStatusIcon(resource.connection_status)}
						<span class="ml-2 text-sm text-gray-600">{resource.connection_status}</span>
					</span>
					<span class="px-3 py-1 rounded-full text-sm font-medium {resource.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
						{resource.enabled ? 'Enabled' : 'Disabled'}
					</span>
				</div>
			</div>
		</div>

		<!-- Resource Info -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Basic Info -->
			<div class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow border p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Resource Information</h3>
					
					<dl class="space-y-3">
						<div>
							<dt class="text-sm font-medium text-gray-500">Resource ID</dt>
							<dd class="text-sm text-gray-900">{resource.resource_id}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Type</dt>
							<dd class="text-sm text-gray-900 capitalize">{resource.type}</dd>
						</div>
						{#if resource.category}
							<div>
								<dt class="text-sm font-medium text-gray-500">Category</dt>
								<dd class="text-sm text-gray-900">{resource.category}</dd>
							</div>
						{/if}
						{#if resource.type === 'machine'}
							<div>
								<dt class="text-sm font-medium text-gray-500">Card Required During Use</dt>
								<dd class="text-sm text-gray-900">{resource.require_card_present ? 'Yes' : 'No'}</dd>
							</div>
						{/if}
						<div>
							<dt class="text-sm font-medium text-gray-500">Created</dt>
							<dd class="text-sm text-gray-900">{formatDateTime(resource.created_at)}</dd>
						</div>
						{#if resource.updated_at}
							<div>
								<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
								<dd class="text-sm text-gray-900">{formatDateTime(resource.updated_at)}</dd>
							</div>
						{/if}
					</dl>
				</div>
			</div>

			<!-- Maintenance Info (for machines) -->
			{#if resource.type === 'machine'}
				<div class="lg:col-span-2">
					<div class="bg-white rounded-lg shadow border p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Maintenance Tracking</h3>
						
						{#if maintenanceIntervals.length === 0}
							<div class="text-center py-8 text-gray-500">
								<p>No maintenance intervals configured.</p>
								<button 
									on:click={openAddModal}
									class="mt-2 text-blue-600 hover:text-blue-800 text-sm"
								>
									+ Add Maintenance Interval
								</button>
							</div>
						{:else}
							<div class="mb-4 flex justify-between items-center">
								<h4 class="text-sm font-medium text-gray-900">Maintenance Intervals</h4>
								<button 
									on:click={openAddModal}
									class="text-blue-600 hover:text-blue-800 text-sm font-medium"
								>
									+ Add Interval
								</button>
							</div>
							
							<div class="space-y-4">
								{#each maintenanceIntervals as interval}
									<div class="border rounded-lg p-4">
										<div class="flex justify-between items-start mb-2">
											<h4 class="font-medium text-gray-900">{interval.name}</h4>
											<div class="flex items-center space-x-2">
												<span class="text-sm text-gray-500">
													{interval.interval_type === 'usage' ? 'Usage-based' : 'Time-based'}
												</span>
												<button 
													on:click={() => openEditModal(interval)}
													class="text-blue-600 hover:text-blue-800 text-sm"
												>
													Edit
												</button>
											</div>
										</div>
										
										<p class="text-sm text-gray-600 mb-3">{interval.description || 'No description'}</p>
										
										<div class="grid grid-cols-2 gap-4 text-sm">
											<div>
												<span class="text-gray-500">Interval:</span>
												<span class="ml-2 text-gray-900">
													{formatIntervalInOriginalUnit(interval.interval_value, interval.display_unit)}
												</span>
											</div>
											<div>
												<span class="text-gray-500">Warning:</span>
												<span class="ml-2 text-gray-900">
													{formatIntervalInOriginalUnit(interval.warning_threshold, interval.display_unit, true)}
												</span>
											</div>
										</div>
										
										<!-- Dynamic progress bar -->
										<div class="mt-3">
											<div class="w-full bg-gray-200 rounded-full h-2">
												<div 
													class="h-2 rounded-full {getProgressColor(interval.progress, interval.isOverdue)}" 
													style="width: {Math.min(interval.progress, 100)}%"
												></div>
											</div>
											<div class="text-xs text-gray-500 mt-1">
												{getNextDueMessage(interval)}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{:else}
				{@const stats = getUsageStats(accessLogs)}
				<!-- Door usage stats -->
				<div class="lg:col-span-2">
					<div class="bg-white rounded-lg shadow border p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
						
						<div class="grid grid-cols-3 gap-4 text-center">
							<div>
								<p class="text-2xl font-bold text-blue-600">{stats.today}</p>
								<p class="text-sm text-gray-500">Today</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-green-600">{stats.week}</p>
								<p class="text-sm text-gray-500">This Week</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-purple-600">{stats.month}</p>
								<p class="text-sm text-gray-500">This Month</p>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Recent Activity -->
		<div class="mt-6">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Recent Access -->
				<div class="lg:col-span-1">
					<div class="bg-white rounded-lg shadow border p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Access</h3>
						
						{#if accessLogs.length === 0}
							<div class="text-center py-8 text-gray-500">
								<p>No recent access logs.</p>
							</div>
						{:else}
							<div class="space-y-3 max-h-80 overflow-y-auto">
								{#each accessLogs as log}
									<div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
										<div>
											<p class="text-sm font-medium text-gray-900">{log.user_name || `User ${log.user_id}`}</p>
											<p class="text-xs text-gray-500">{formatDateTime(log.access_time)}</p>
										</div>
										<div class="text-right">
											<span class="text-xs px-2 py-1 rounded-full {log.access_granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
												{log.access_granted ? 'Granted' : 'Denied'}
											</span>
											{#if log.usage_minutes}
												<p class="text-xs text-gray-500 mt-1">{formatDuration(log.usage_minutes)}</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Recent Maintenance (for machines) -->
				{#if resource.type === 'machine'}
					<div class="lg:col-span-2">
						<div class="bg-white rounded-lg shadow border p-6">
							<div class="flex justify-between items-center mb-4">
								<h3 class="text-lg font-semibold text-gray-900">Recent Maintenance</h3>
								{#if maintenanceEvents.length > 0}
									<a 
										href="/resources/{resource.resource_id}/maintenance" 
										class="text-blue-600 hover:text-blue-800 text-sm font-medium"
									>
										View All →
									</a>
								{/if}
							</div>
							
							{#if maintenanceEvents.length === 0}
								<div class="text-center py-8 text-gray-500">
									<p>No maintenance events recorded.</p>
								</div>
							{:else}
								<div class="space-y-4 max-h-80 overflow-y-auto">
									{#each maintenanceEvents.slice(0, 5) as event}
										<div class="border rounded-lg p-3 bg-gray-50">
											<div class="flex justify-between items-start mb-2">
												<div class="flex-1">
													<div class="flex items-center space-x-2">
														<h4 class="text-sm font-medium text-gray-900">
															{event.interval_name || 'General Maintenance'}
														</h4>
														<span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">
															{event.maintenance_type}
														</span>
													</div>
													<p class="text-xs text-gray-500 mt-1">
														{formatDateTime(event.maintenance_date)}
													</p>
												</div>
											</div>
											
											{#if event.performed_by_name}
												<div class="mb-2">
													<span class="text-xs text-gray-500">Performed by:</span>
													<span class="text-xs text-gray-700 font-medium ml-1">{event.performed_by_name}</span>
												</div>
											{/if}
											
											{#if event.notes}
												<div class="bg-white rounded p-2 border">
													<p class="text-xs text-gray-600 leading-relaxed">{event.notes}</p>
												</div>
											{/if}
										</div>
									{/each}
								</div>
								<div class="mt-3 text-xs text-gray-400 text-center">
									{#if maintenanceEvents.length > 5}
										Showing 5 of {maintenanceEvents.length} maintenance events
									{:else}
										{maintenanceEvents.length} maintenance event{maintenanceEvents.length === 1 ? '' : 's'}
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<!-- Door statistics -->
					<div class="lg:col-span-2">
						<div class="bg-white rounded-lg shadow border p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Access Statistics</h3>
							
							<div class="space-y-4">
								<div class="flex justify-between">
									<span class="text-sm text-gray-600">Total Access Attempts:</span>
									<span class="text-sm font-medium text-gray-900">{accessLogs.length}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-sm text-gray-600">Successful Access:</span>
									<span class="text-sm font-medium text-green-600">{accessLogs.filter(log => log.access_granted).length}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-sm text-gray-600">Denied Access:</span>
									<span class="text-sm font-medium text-red-600">{accessLogs.filter(log => !log.access_granted).length}</span>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Add Maintenance Interval Modal -->
{#if showAddModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" tabindex="-1" on:click={closeModals} on:keydown={(e) => e.key === 'Escape' && closeModals()}>
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" role="dialog" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation>
			<form method="POST" action="?/createMaintenanceInterval" use:enhance on:submit={closeModals}>
				<h3 class="text-lg font-medium text-gray-900 mb-4">Add Maintenance Interval</h3>
				
				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={newInterval.name}
							required
							placeholder="e.g., Oil Change, Filter Replacement"
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						/>
					</div>
					
					<div>
						<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
						<textarea
							id="description"
							name="description"
							bind:value={newInterval.description}
							rows="2"
							placeholder="Description of maintenance tasks..."
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						></textarea>
					</div>
					
					<div>
						<label for="interval_type" class="block text-sm font-medium text-gray-700">Type</label>
						<select
							id="interval_type"
							name="interval_type"
							bind:value={newInterval.interval_type}
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						>
							<option value="time">Time-based</option>
							<option value="usage">Usage-based</option>
						</select>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="interval_value" class="block text-sm font-medium text-gray-700">Interval</label>
							<input
								type="number"
								id="interval_value"
								name="interval_value"
								bind:value={newInterval.interval_value}
								min="1"
								required
								class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
							/>
						</div>
						<div>
							<label for="interval_unit" class="block text-sm font-medium text-gray-700">Unit</label>
							<select
								id="interval_unit"
								name="interval_unit"
								bind:value={newInterval.interval_unit}
								class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
							>
								<option value="minutes">Minutes</option>
								<option value="hours">Hours</option>
								<option value="days">Days</option>
								<option value="weeks">Weeks</option>
								<option value="months">Months</option>
							</select>
						</div>
					</div>
					
					<div>
						<label for="warning_threshold" class="block text-sm font-medium text-gray-700">Warning Threshold</label>
						<input
							type="number"
							id="warning_threshold"
							name="warning_threshold"
							bind:value={newInterval.warning_threshold}
							min="0"
							placeholder="Warn this many {newInterval.interval_unit} before due"
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						/>
						<p class="text-xs text-gray-500 mt-1">Warn this many {newInterval.interval_unit} before maintenance is due</p>
					</div>
				</div>
				
				<div class="flex justify-end space-x-3 mt-6">
					<button
						type="button"
						on:click={closeModals}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
					>
						Create Interval
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Maintenance Interval Modal -->
{#if showEditModal && editingInterval}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" tabindex="-1" on:click={closeModals} on:keydown={(e) => e.key === 'Escape' && closeModals()}>
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" role="dialog" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation>
			<form method="POST" action="?/updateMaintenanceInterval" use:enhance on:submit={closeModals}>
				<input type="hidden" name="id" value={editingInterval.id} />
				
				<h3 class="text-lg font-medium text-gray-900 mb-4">Edit Maintenance Interval</h3>
				
				<div class="space-y-4">
					<div>
						<label for="edit_name" class="block text-sm font-medium text-gray-700">Name</label>
						<input
							type="text"
							id="edit_name"
							name="name"
							bind:value={editingInterval.name}
							required
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						/>
					</div>
					
					<div>
						<label for="edit_description" class="block text-sm font-medium text-gray-700">Description</label>
						<textarea
							id="edit_description"
							name="description"
							bind:value={editingInterval.description}
							rows="2"
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						></textarea>
					</div>
					
					<div>
						<label for="edit_interval_type" class="block text-sm font-medium text-gray-700">Type</label>
						<select
							id="edit_interval_type"
							name="interval_type"
							bind:value={editingInterval.interval_type}
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						>
							<option value="time">Time-based</option>
							<option value="usage">Usage-based</option>
						</select>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="edit_interval_value" class="block text-sm font-medium text-gray-700">Interval</label>
							<input
								type="number"
								id="edit_interval_value"
								name="interval_value"
								bind:value={editingInterval.interval_value}
								min="1"
								required
								class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
							/>
						</div>
						<div>
							<label for="edit_interval_unit" class="block text-sm font-medium text-gray-700">Unit</label>
							<select
								id="edit_interval_unit"
								name="interval_unit"
								bind:value={editingInterval.interval_unit}
								class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
							>
								<option value="minutes">Minutes</option>
								<option value="hours">Hours</option>
								<option value="days">Days</option>
								<option value="weeks">Weeks</option>
								<option value="months">Months</option>
							</select>
						</div>
					</div>
					
					<div>
						<label for="edit_warning_threshold" class="block text-sm font-medium text-gray-700">Warning Threshold</label>
						<input
							type="number"
							id="edit_warning_threshold"
							name="warning_threshold"
							bind:value={editingInterval.warning_threshold}
							min="0"
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						/>
						<p class="text-xs text-gray-500 mt-1">Warn this many {editingInterval.interval_unit} before maintenance is due</p>
					</div>
				</div>
				
				<div class="flex justify-between mt-6">
					<button
						type="button"
						on:click={() => {
							if (confirm('Are you sure you want to delete this maintenance interval?')) {
								const form = document.createElement('form');
								form.method = 'POST';
								form.action = '?/deleteMaintenanceInterval';
								const input = document.createElement('input');
								input.type = 'hidden';
								input.name = 'id';
								input.value = editingInterval.id;
								form.appendChild(input);
								document.body.appendChild(form);
								form.submit();
								closeModals();
							}
						}}
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
					>
						Delete
					</button>
					<div class="space-x-3">
						<button
							type="button"
							on:click={closeModals}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
						>
							Update Interval
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}
