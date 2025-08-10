<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	
	export let data;
	
	let resourceFilter = data.filters.resourceId || '';
	let userFilter = data.filters.userId || '';
	let maintenanceTypeFilter = data.filters.maintenanceType || '';
	let startDateFilter = data.filters.startDate || '';
	let endDateFilter = data.filters.endDate || '';
	let limitFilter = data.filters.limit || 100;

	// Modal state
	let showLogModal = false;
	let selectedLog = null;

	function formatDateTime(timestamp) {
		return new Date(timestamp).toLocaleString();
	}

	function openLogModal(log) {
		selectedLog = log;
		showLogModal = true;
	}

	function closeLogModal() {
		showLogModal = false;
		selectedLog = null;
	}

	function applyFilters() {
		const params = new URLSearchParams();
		
		if (resourceFilter) params.set('resource', resourceFilter);
		if (userFilter) params.set('user', userFilter);
		if (maintenanceTypeFilter) params.set('maintenance_type', maintenanceTypeFilter);
		if (startDateFilter) params.set('start_date', startDateFilter);
		if (endDateFilter) params.set('end_date', endDateFilter);
		if (limitFilter !== 100) params.set('limit', limitFilter.toString());
		
		goto(`?${params.toString()}`);
	}

	function clearFilters() {
		resourceFilter = '';
		userFilter = '';
		maintenanceTypeFilter = '';
		startDateFilter = '';
		endDateFilter = '';
		limitFilter = 100;
		goto('/maintenance/logs');
	}

	function exportLogs() {
		const headers = ['Date', 'Machine', 'Category', 'Maintenance Type', 'Interval', 'Performed By', 'Notes'];
		const csvData = [
			headers,
			...data.logs.map(log => [
				formatDateTime(log.maintenance_date),
				log.resource_name,
				log.resource_category,
				log.maintenance_type,
				log.interval_name || 'General',
				log.performed_by_name || 'Admin',
				log.notes
			])
		];
		
		const csv = csvData.map(row => 
			row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
		).join('\n');
		
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `maintenance-logs-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Maintenance Logs - MakerPass Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<div class="mb-6 sm:mb-8">
			<Breadcrumb items={[
				{ href: '/maintenance', label: 'Maintenance' },
				{ label: 'Logs' }
			]} />
			
			<PageHeader
				title="Maintenance Logs"
				description="View and filter maintenance activity across all machines"
			>
				<div slot="actions" class="flex space-x-2">
					<Button
						variant="secondary"
						on:click={exportLogs}
					>
						Export CSV
					</Button>
				</div>
			</PageHeader>
		</div>

		<!-- Filters -->
		<div class="bg-white rounded-lg shadow border p-4 mb-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
			
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
				<!-- Machine Filter -->
				<div>
					<label for="resource" class="block text-sm font-medium text-gray-700 mb-1">Machine</label>
					<select
						id="resource"
						bind:value={resourceFilter}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
					>
						<option value="">All Machines</option>
						{#each data.resources as resource}
							<option value={resource.id}>{resource.name} ({resource.category})</option>
						{/each}
					</select>
				</div>

				<!-- User Filter -->
				<div>
					<label for="user" class="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
					<select
						id="user"
						bind:value={userFilter}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
					>
						<option value="">All Users</option>
						{#each data.users as user}
							<option value={user.id}>{user.name}</option>
						{/each}
					</select>
				</div>

				<!-- Maintenance Type Filter -->
				<div>
					<label for="maintenance_type" class="block text-sm font-medium text-gray-700 mb-1">Type</label>
					<select
						id="maintenance_type"
						bind:value={maintenanceTypeFilter}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
					>
						<option value="">All Types</option>
						<option value="scheduled">Scheduled</option>
						<option value="emergency">Emergency</option>
						<option value="preventive">Preventive</option>
						<option value="repair">Repair</option>
					</select>
				</div>

				<!-- Start Date Filter -->
				<div>
					<label for="start_date" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
					<input
						id="start_date"
						type="date"
						bind:value={startDateFilter}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
					/>
				</div>

				<!-- End Date Filter -->
				<div>
					<label for="end_date" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
					<input
						id="end_date"
						type="date"
						bind:value={endDateFilter}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
					/>
				</div>

				<!-- Limit Filter -->
				<div>
					<label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Show</label>
					<select
						id="limit"
						bind:value={limitFilter}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
					>
						<option value={50}>50 logs</option>
						<option value={100}>100 logs</option>
						<option value={250}>250 logs</option>
						<option value={500}>500 logs</option>
						<option value={1000}>1000 logs</option>
					</select>
				</div>
			</div>

			<div class="flex space-x-2">
				<Button
					variant="primary"
					on:click={applyFilters}
				>
					Apply Filters
				</Button>
				<Button
					variant="secondary"
					on:click={clearFilters}
				>
					Clear All
				</Button>
			</div>
		</div>

		<!-- Results Summary -->
		<div class="mb-4">
			<p class="text-sm text-gray-600">
				Showing {data.logs.length} maintenance log{data.logs.length === 1 ? '' : 's'}
				{#if Object.values(data.filters).some(v => v)}
					(filtered)
				{/if}
				{#if data.logs.length > 0}
					• Click on any row to view full details
				{/if}
			</p>
		</div>

		<!-- Logs Table -->
		{#if data.logs.length > 0}
			<div class="bg-white rounded-lg shadow border overflow-hidden">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Date/Time
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Machine
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Type
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Interval
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Performed By
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Notes
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each data.logs as log}
								<tr class="hover:bg-gray-50 cursor-pointer" on:click={() => openLogModal(log)}>
									<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDateTime(log.maintenance_date)}
									</td>
									<td class="px-4 py-4 text-sm text-gray-900">
										<div class="flex flex-col">
											<span class="font-medium text-blue-600 truncate">
												{log.resource_name}
											</span>
											<span class="text-xs text-gray-500">{log.resource_category}</span>
										</div>
									</td>
									<td class="px-4 py-4 whitespace-nowrap text-sm">
										<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full
											{log.maintenance_type === 'emergency' ? 'bg-red-100 text-red-700' :
											log.maintenance_type === 'repair' ? 'bg-orange-100 text-orange-700' :
											log.maintenance_type === 'preventive' ? 'bg-blue-100 text-blue-700' :
											'bg-green-100 text-green-700'}
										">
											{log.maintenance_type.charAt(0).toUpperCase() + log.maintenance_type.slice(1)}
										</span>
									</td>
									<td class="px-4 py-4 text-sm text-gray-900">
										{log.interval_name || 'General'}
									</td>
									<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
										{log.performed_by_name || 'Admin'}
									</td>
									<td class="px-4 py-4 text-sm text-gray-900">
										<div class="max-w-xs truncate" title={log.notes}>
											{log.notes}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow border p-8 text-center">
				<div class="text-gray-400 mb-4">
					<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<p class="text-lg text-gray-500 mb-2">No maintenance logs found</p>
				<p class="text-sm text-gray-400 mb-4">
					{#if Object.values(data.filters).some(v => v)}
						Try adjusting your filters or
						<Button
							variant="link"
							size="sm"
							on:click={clearFilters}
						>
							clear all filters
						</Button>
					{:else}
						Log your first maintenance activity to see it here
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>

<!-- Maintenance Log Detail Modal -->
<Modal
	bind:isOpen={showLogModal}
	title="Maintenance Log Details"
	size="xl"
	on:close={closeLogModal}
>
	{#if selectedLog}
		<div class="space-y-4">
			<!-- Date and Time -->
			<div class="flex justify-between items-start">
				<div>
					<h4 class="text-sm font-medium text-gray-900 mb-1">Date & Time</h4>
					<p class="text-sm text-gray-600">{formatDateTime(selectedLog.maintenance_date)}</p>
				</div>
				<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full
					{selectedLog.maintenance_type === 'emergency' ? 'bg-red-100 text-red-700' :
					selectedLog.maintenance_type === 'repair' ? 'bg-orange-100 text-orange-700' :
					selectedLog.maintenance_type === 'preventive' ? 'bg-blue-100 text-blue-700' :
					'bg-green-100 text-green-700'}
				">
					{selectedLog.maintenance_type.charAt(0).toUpperCase() + selectedLog.maintenance_type.slice(1)}
				</span>
			</div>

			<!-- Machine Information -->
			<div class="border-t pt-4">
				<h4 class="text-sm font-medium text-gray-900 mb-2">Machine</h4>
				<div class="bg-gray-50 rounded-md p-3">
					<div class="flex justify-between items-center">
						<div>
							<p class="text-sm font-medium text-gray-900">{selectedLog.resource_name}</p>
							<p class="text-xs text-gray-500">{selectedLog.resource_category} • {selectedLog.resource_code}</p>
						</div>
						<a 
							href="/resources/{selectedLog.resource_code}" 
							class="text-blue-600 hover:text-blue-800 text-sm font-medium"
							on:click={closeLogModal}
						>
							View Machine →
						</a>
					</div>
				</div>
			</div>

			<!-- Maintenance Interval -->
			{#if selectedLog.interval_name}
				<div class="border-t pt-4">
					<h4 class="text-sm font-medium text-gray-900 mb-2">Maintenance Interval</h4>
					<p class="text-sm text-gray-600 bg-blue-50 rounded-md p-3">{selectedLog.interval_name}</p>
				</div>
			{/if}

			<!-- Performed By -->
			<div class="border-t pt-4">
				<h4 class="text-sm font-medium text-gray-900 mb-2">Performed By</h4>
				<p class="text-sm text-gray-600">{selectedLog.performed_by_name || 'Admin'}</p>
			</div>

			<!-- Notes -->
			<div class="border-t pt-4">
				<h4 class="text-sm font-medium text-gray-900 mb-2">Notes</h4>
				<div class="bg-gray-50 rounded-md p-4">
					<p class="text-sm text-gray-700 whitespace-pre-wrap">{selectedLog.notes}</p>
				</div>
			</div>
		</div>
	{/if}
	
	<div slot="footer">
		<Button
			variant="secondary"
			on:click={closeLogModal}
		>
			Close
		</Button>
	</div>
</Modal>
