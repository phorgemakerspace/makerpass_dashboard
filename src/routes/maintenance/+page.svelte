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
			<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{#each data.maintenanceData as { resource, intervals, events }}
					<div class="bg-white rounded-lg shadow border p-6 flex flex-col">
						<div class="flex items-start justify-between mb-4">
							<div>
								<h3 class="text-lg font-semibold text-gray-900">{resource.name}</h3>
								<p class="text-sm text-gray-500">{resource.category} • ID: {resource.resource_id}</p>
							</div>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {resource.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
								{resource.enabled ? 'Active' : 'Disabled'}
							</span>
						</div>

						<!-- Content that can grow -->
						<div class="flex-grow">
							{#if intervals.length === 0}
								<div class="text-center py-6 text-gray-400">
									<p class="text-sm">No maintenance intervals configured</p>
									<a 
										href="/resources/{resource.resource_id}"
										class="mt-2 text-blue-600 hover:text-blue-800 text-sm"
									>
										+ Add Interval
									</a>
								</div>
							{:else}
								<div class="space-y-3 mb-4">
									<h4 class="text-sm font-medium text-gray-700">Maintenance Intervals</h4>
									{#each intervals as interval}
										{@const status = getMaintenanceStatus(interval)}
										<div class="border rounded p-3 {status.bg}">
											<div class="flex justify-between items-start">
												<div>
													<p class="text-sm font-medium text-gray-900">{interval.name}</p>
													<p class="text-xs text-gray-600">
														Every {formatIntervalInOriginalUnit(interval.interval_value, interval.display_unit)} 
														({interval.interval_type})
													</p>
												</div>
												<span class="text-xs px-2 py-1 rounded-full {status.bg} {status.color} border">
													{status.status}
												</span>
											</div>
											
											<!-- Real progress bar -->
											<div class="mt-2">
												<div class="w-full bg-gray-200 rounded-full h-1.5">
													<div class="h-1.5 rounded-full {getProgressColor(interval.progress, interval.isOverdue)}" 
														 style="width: {Math.min(interval.progress, 100)}%"></div>
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

						<!-- Actions stuck to bottom -->
						<div class="mt-4 flex space-x-2">
							<a
								href="/resources/{resource.resource_id}"
								class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium text-center"
							>
								View Details
							</a>
							<button
								on:click={() => openLogMaintenanceModal(resource)}
								class="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm font-medium"
							>
								Log Maintenance
							</button>
						</div>
					</div>
				{/each}
			</div>

			<!-- Real summary stats -->
			{@const allIntervals = data.maintenanceData.flatMap(d => d.intervals)}
			{@const overdueCount = allIntervals.filter(i => i.isOverdue).length}
			{@const warningCount = allIntervals.filter(i => !i.isOverdue && i.progress >= 80).length}
			{@const upToDateCount = allIntervals.filter(i => !i.isOverdue && i.progress < 80).length}
			
			<div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
				<div class="bg-white rounded-lg shadow border p-4 text-center">
					<p class="text-2xl font-bold text-gray-900">{data.maintenanceData.length}</p>
					<p class="text-sm text-gray-500">Total Machines</p>
				</div>
				<div class="bg-white rounded-lg shadow border p-4 text-center">
					<p class="text-2xl font-bold text-red-600">{overdueCount}</p>
					<p class="text-sm text-gray-500">Overdue</p>
				</div>
				<div class="bg-white rounded-lg shadow border p-4 text-center">
					<p class="text-2xl font-bold text-yellow-600">{warningCount}</p>
					<p class="text-sm text-gray-500">Due Soon</p>
				</div>
				<div class="bg-white rounded-lg shadow border p-4 text-center">
					<p class="text-2xl font-bold text-green-600">{upToDateCount}</p>
					<p class="text-sm text-gray-500">Up to Date</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Log Maintenance Modal -->
{#if showLogMaintenanceModal && selectedResource}
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
				action="/resources/{selectedResource.resource_id}?/logMaintenance" 
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
					<h3 class="text-lg font-semibold text-gray-900">Log Maintenance</h3>
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
				
				<div class="text-sm text-gray-600 mb-4">
					<strong>{selectedResource.name}</strong> • {selectedResource.resource_id}
				</div>

				<div>
					<label for="interval_id" class="block text-sm font-medium text-gray-700 mb-1">
						Maintenance Interval (Optional)
					</label>
					<select 
						id="interval_id" 
						name="interval_id" 
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">General maintenance (not tied to specific interval)</option>
						{#each data.maintenanceData.find(d => d.resource.id === selectedResource.id)?.intervals || [] as interval}
							<option value={interval.id}>{interval.name}</option>
						{/each}
					</select>
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
