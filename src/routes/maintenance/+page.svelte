<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	
	let showLogMaintenanceModal = false;
	let selectedResource = null;
	let selectedInterval = null;
	let userSearch = '';
	let userSearchResults = [];
	let selectedUser = null;
	let showUserDropdown = false;
	let searchTimeout;

	function openLogMaintenanceModal(resource, interval = null) {
		selectedResource = resource;
		selectedInterval = interval;
		showLogMaintenanceModal = true;
		// Reset user selection
		userSearch = '';
		userSearchResults = [];
		selectedUser = null;
		showUserDropdown = false;
	}

	// Handle machine selection change in the dropdown
	function handleMachineSelection(event) {
		const resourceId = event.target.value;
		if (resourceId) {
			// Find the full resource object from the maintenance data
			const machineData = data.maintenanceData.find(d => d.resource.resource_id === resourceId);
			selectedResource = machineData ? machineData.resource : null;
		} else {
			selectedResource = null;
		}
		// Clear any previously selected interval when changing machines
		selectedInterval = null;
	}

	function closeModal() {
		showLogMaintenanceModal = false;
		selectedResource = null;
		selectedInterval = null;
		userSearch = '';
		userSearchResults = [];
		selectedUser = null;
		showUserDropdown = false;
	}

	async function searchUsers() {
		if (userSearch.length === 0) {
			userSearchResults = [];
			showUserDropdown = false;
			return;
		}

		try {
			const response = await fetch(`/api/users?search=${encodeURIComponent(userSearch)}`);
			const users = await response.json();
			userSearchResults = users;
			showUserDropdown = true;
		} catch (error) {
			console.error('Error searching users:', error);
			userSearchResults = [];
		}
	}

	function handleUserSearchInput(event) {
		userSearch = event.target.value;
		selectedUser = null; // Clear selection when typing
		
		// Debounce the search
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(searchUsers, 300);
	}

	function selectUser(user) {
		selectedUser = user;
		userSearch = user.name;
		showUserDropdown = false;
		userSearchResults = [];
	}

	function clearUserSelection() {
		selectedUser = null;
		userSearch = '';
		showUserDropdown = false;
		userSearchResults = [];
	}	function formatDuration(minutes) {
		if (!minutes) return '0 minutes';
		
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		
		if (hours === 0) return `${mins} minutes`;
		if (mins === 0) return `${hours} hours`;
		return `${hours}h ${mins}m`;
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
	
	function formatDateTime(timestamp) {
		return new Date(timestamp).toLocaleString();
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
				return 'Overdue';
			}
			return `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`;
		}
		
		// Calculate time remaining
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		
		if (diffDays > 0) {
			return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
		} else if (diffHours > 0) {
			return `Due in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
		} else {
			return 'Due soon';
		}
	}
	
	// Get progress bar color based on progress percentage
	function getProgressColor(progress, isOverdue) {
		if (isOverdue) return 'bg-red-500';
		if (progress >= 80) return 'bg-yellow-500';
		return 'bg-green-500';
	}
	
	// Get status info for display
	function getMaintenanceStatus(interval) {
		if (interval.isOverdue) {
			return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-100' };
		}
		if (interval.progress >= 80) {
			return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
		}
		return { status: 'ok', color: 'text-green-600', bg: 'bg-green-100' };
	}
</script>

<svelte:head>
	<title>Maintenance - MakerPass Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<div class="mb-6 sm:mb-8">
			<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Maintenance Overview</h1>
			<p class="text-gray-600 mt-2 text-sm sm:text-base">Track and manage machine maintenance schedules</p>
		</div>

		{#if data.maintenanceData.length === 0}
			<div class="text-center py-12 text-gray-500">
				<p class="text-lg">No machines configured yet.</p>
				<a href="/resources" class="mt-2 text-blue-600 hover:text-blue-800">
					Go to Resources to add machines
				</a>
			</div>
		{:else}
			<!-- Summary stats -->
			{@const allIntervals = data.maintenanceData.flatMap(d => d.intervals)}
			{@const overdueCount = allIntervals.filter(i => i.isOverdue).length}
			{@const warningCount = allIntervals.filter(i => !i.isOverdue && i.progress >= 80).length}
			{@const upToDateCount = allIntervals.filter(i => !i.isOverdue && i.progress < 80).length}
			
			<div class="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
				<div class="bg-white rounded-lg shadow border p-3 sm:p-4 text-center">
					<p class="text-xl sm:text-2xl font-bold text-gray-900">{data.maintenanceData.length}</p>
					<p class="text-xs sm:text-sm text-gray-500">Total Machines</p>
				</div>
				<div class="bg-white rounded-lg shadow border p-3 sm:p-4 text-center">
					<p class="text-xl sm:text-2xl font-bold text-red-600">{overdueCount}</p>
					<p class="text-xs sm:text-sm text-gray-500">Overdue</p>
				</div>
				<div class="bg-white rounded-lg shadow border p-3 sm:p-4 text-center">
					<p class="text-xl sm:text-2xl font-bold text-yellow-600">{warningCount}</p>
					<p class="text-xs sm:text-sm text-gray-500">Due Soon</p>
				</div>
				<div class="bg-white rounded-lg shadow border p-3 sm:p-4 text-center">
					<p class="text-xl sm:text-2xl font-bold text-green-600">{upToDateCount}</p>
					<p class="text-xs sm:text-sm text-gray-500">Up to Date</p>
				</div>
			</div>

			<!-- Header with General Maintenance Link -->
			<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
				<h2 class="text-xl font-semibold text-gray-900">Upcoming Maintenance Tasks</h2>
				<button
					type="button"
					on:click={() => openLogMaintenanceModal(null)}
					class="text-blue-600 hover:text-blue-800 font-medium bg-transparent border-none cursor-pointer p-0 text-left sm:text-right"
				>
					+ Log General Maintenance
				</button>
			</div>

			<!-- Maintenance Tasks List -->
			{@const allTasks = data.maintenanceData
				.flatMap(({ resource, intervals }) => 
					intervals.map(interval => ({ ...interval, resource }))
				)
				.sort((a, b) => {
					// Sort by priority: overdue first, then by progress percentage (highest first)
					if (a.isOverdue && !b.isOverdue) return -1;
					if (!a.isOverdue && b.isOverdue) return 1;
					if (a.isOverdue && b.isOverdue) {
						// Both overdue, sort by how overdue they are (most overdue first)
						return new Date(a.nextDue || 0) - new Date(b.nextDue || 0);
					}
					// Neither overdue, sort by progress (closest to due first)
					return b.progress - a.progress;
				})
			}

			{#if allTasks.length === 0}
				<div class="bg-white rounded-lg shadow border p-8 text-center">
					<div class="text-gray-400 mb-4">
						<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<p class="text-lg text-gray-500 mb-2">No maintenance intervals configured</p>
					<p class="text-sm text-gray-400 mb-4">Add maintenance intervals to machines to track upcoming tasks</p>
					<a href="/resources" class="text-blue-600 hover:text-blue-800 font-medium">
						Go to Resources →
					</a>
				</div>
			{:else}
				<div class="bg-white rounded-lg shadow border overflow-hidden">
					<div class="divide-y divide-gray-200">
						{#each allTasks as task}
							{@const status = getMaintenanceStatus(task)}
							<div class="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
								<div class="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex-1 min-w-0">
										<div class="flex items-center space-x-3 mb-2">
											<!-- Priority indicator -->
											<div class="flex-shrink-0">
												{#if task.isOverdue}
													<div class="w-3 h-3 bg-red-500 rounded-full"></div>
												{:else if task.progress >= 80}
													<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
												{:else}
													<div class="w-3 h-3 bg-green-500 rounded-full"></div>
												{/if}
											</div>
											
											<!-- Task info -->
											<div class="flex-1 min-w-0">
												<div class="flex items-center space-x-2 mb-1">
													<h3 class="text-sm font-medium text-gray-900 truncate">
														{task.name}
													</h3>
													<span class="text-xs px-2 py-1 rounded-full {status.bg} {status.color} flex-shrink-0">
														{#if task.isOverdue}
															Overdue
														{:else if task.progress >= 80}
															Due Soon
														{:else}
															On Track
														{/if}
													</span>
												</div>
												<div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
													<p class="text-sm text-gray-600 mb-1 sm:mb-0">
														<a href="/resources/{task.resource.resource_id}" class="font-medium hover:text-blue-600">{task.resource.name}</a> • 
														{task.resource.category}
													</p>
													<p class="text-sm text-gray-500">
														Every {formatIntervalInOriginalUnit(task.interval_value, task.display_unit)}
													</p>
												</div>
											</div>
										</div>
										
										<!-- Progress bar and status -->
										<div class="flex items-center space-x-3 sm:space-x-4">
											<div class="flex-1">
												<div class="w-full bg-gray-200 rounded-full h-2">
													<div class="h-2 rounded-full {getProgressColor(task.progress, task.isOverdue)}" 
														 style="width: {Math.min(task.progress, 100)}%"></div>
												</div>
											</div>
											<div class="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
												{getNextDueMessage(task)}
											</div>
											<div class="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0">
												{Math.round(task.progress)}%
											</div>
										</div>
									</div>
									
									<!-- Action buttons -->
									<div class="flex items-center justify-end space-x-2 sm:ml-4 pt-2 sm:pt-0">
										<a
											href="/resources/{task.resource.resource_id}/maintenance"
											class="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded border border-blue-200 hover:border-blue-300 whitespace-nowrap"
										>
											View Logs
										</a>
										<button
											on:click={() => openLogMaintenanceModal(task.resource, task)}
											class="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded whitespace-nowrap"
										>
											Log Maintenance
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Log Maintenance Modal -->
{#if showLogMaintenanceModal}
	<div 
		class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
		role="dialog" 
		aria-modal="true"
		tabindex="-1"
		on:click={closeModal} 
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<div 
			class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" 
			role="dialog"
			tabindex="-1"
			on:click|stopPropagation 
			on:keydown|stopPropagation
		>
			<form 
				method="POST" 
				action={selectedResource ? `/resources/${selectedResource.resource_id}?/logMaintenance` : '?/logGeneralMaintenance'}
				class="space-y-4"
				use:enhance={({ formElement, formData, action, cancel }) => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							closeModal();
							// Invalidate all data to refresh the page
							await invalidateAll();
						}
						await update();
					};
				}}
			>
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold text-gray-900">
						{#if selectedInterval}
							Log Maintenance: {selectedInterval.name}
						{:else if !selectedResource}
							Log General Maintenance
						{:else}
							Log Maintenance
						{/if}
					</h3>
					<button 
						type="button" 
						on:click={closeModal} 
						class="text-gray-400 hover:text-gray-600"
						aria-label="Close modal"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				
				<!-- Machine Selection (for general maintenance) -->
				{#if !selectedResource}
					<div>
						<label for="resource_id" class="block text-sm font-medium text-gray-700 mb-1">
							Select Machine
						</label>
						<select 
							id="resource_id" 
							name="resource_id" 
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							on:change={handleMachineSelection}
							required
						>
							<option value="">Choose a machine...</option>
							{#each data.maintenanceData as { resource }}
								<option value={resource.resource_id}>{resource.name} ({resource.category})</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="text-sm text-gray-600 mb-4">
						<strong>{selectedResource.name}</strong> • {selectedResource.resource_id}
					</div>
					<input type="hidden" name="resource_id" value={selectedResource.resource_id} />
				{/if}

				<div>
					<label for="interval_id" class="block text-sm font-medium text-gray-700 mb-1">
						Maintenance Interval (Optional)
					</label>
					{#if selectedInterval}
						<!-- Pre-selected interval (read-only display) -->
						<div class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
							<div class="flex justify-between items-center">
								<span class="font-medium text-gray-900">{selectedInterval.name}</span>
								<button
									type="button"
									on:click={() => selectedInterval = null}
									class="text-sm text-blue-600 hover:text-blue-800"
								>
									Change
								</button>
							</div>
							<p class="text-xs text-gray-500 mt-1">
								{selectedInterval.resource.name} • Every {formatIntervalInOriginalUnit(selectedInterval.interval_value, selectedInterval.display_unit)}
							</p>
						</div>
						<input type="hidden" name="interval_id" value={selectedInterval.id} />
					{:else if selectedResource}
						<!-- Dropdown to select interval for specific machine -->
						<select 
							id="interval_id" 
							name="interval_id" 
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">General maintenance (not tied to specific interval)</option>
							{#each data.maintenanceData.find(d => d.resource.resource_id === selectedResource.resource_id)?.intervals || [] as interval}
								<option value={interval.id}>{interval.name}</option>
							{/each}
						</select>
					{:else}
						<!-- No interval selection when no machine is selected yet -->
						<div class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
							Select a machine first to choose an interval (optional)
						</div>
						<input type="hidden" name="interval_id" value="" />
					{/if}
				</div>

				<div>
					<label for="maintenance_type" class="block text-sm font-medium text-gray-700 mb-1">
						Maintenance Type
					</label>
					<select 
						id="maintenance_type" 
						name="maintenance_type" 
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="scheduled">Scheduled</option>
						<option value="emergency">Emergency</option>
						<option value="preventive">Preventive</option>
						<option value="repair">Repair</option>
					</select>
				</div>

				<!-- User Selection Field -->
				<div class="relative">
					<label for="performed_by" class="block text-sm font-medium text-gray-700 mb-1">
						Performed By (Optional)
					</label>
					<div class="relative">
						<input 
							type="text"
							placeholder="Search for user or leave blank for admin..."
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							bind:value={userSearch}
							on:input={handleUserSearchInput}
							on:focus={() => userSearch.length > 0 && searchUsers()}
							autocomplete="off"
						/>
						{#if selectedUser}
							<button
								type="button"
								on:click={clearUserSelection}
								class="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
								aria-label="Clear selection"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
							</button>
						{/if}
					</div>
					
					<!-- User dropdown -->
					{#if showUserDropdown && userSearchResults.length > 0}
						<div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
							{#each userSearchResults as user}
								<button
									type="button"
									class="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
									on:click={() => selectUser(user)}
								>
									<div class="font-medium text-gray-900">{user.name}</div>
									<div class="text-sm text-gray-500">{user.email}</div>
								</button>
							{/each}
						</div>
					{/if}
					
					<!-- Hidden input for form submission -->
					<input type="hidden" name="performed_by" value={selectedUser?.id || ''} />
				</div>

				<div>
					<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
						Notes
					</label>
					<textarea 
						id="notes" 
						name="notes" 
						rows="3"
						placeholder="Describe what maintenance was performed..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					></textarea>
				</div>

				<div class="flex space-x-3 pt-4">
					<button 
						type="submit" 
						class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
					>
						Log Maintenance
					</button>
					<button 
						type="button" 
						on:click={closeModal}
						class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
