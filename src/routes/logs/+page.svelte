<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	
	export let data;
	
	let resourceFilter = data.filters.resourceId || '';
	let userFilter = data.filters.userId || '';
	let startDateFilter = data.filters.startDate || '';
	let endDateFilter = data.filters.endDate || '';
	let limitFilter = data.filters.limit || 50;

	function applyFilters() {
		const searchParams = new URLSearchParams();
		
		if (resourceFilter) searchParams.set('resource', resourceFilter);
		if (userFilter) searchParams.set('user', userFilter);
		if (startDateFilter) searchParams.set('start_date', startDateFilter);
		if (endDateFilter) searchParams.set('end_date', endDateFilter);
		if (limitFilter !== 50) searchParams.set('limit', limitFilter.toString());
		
		const queryString = searchParams.toString();
		goto(`/logs${queryString ? '?' + queryString : ''}`, { replaceState: true });
	}

	function clearFilters() {
		resourceFilter = '';
		userFilter = '';
		startDateFilter = '';
		endDateFilter = '';
		limitFilter = 50;
		goto('/logs', { replaceState: true });
	}
	
	function formatTimestamp(timestamp) {
		return new Date(timestamp).toLocaleString();
	}
	
	function getReasonText(reason) {
		const reasonMap = {
			'granted': 'Access Granted',
			'denied': 'Access Denied',
			'invalid_rfid': 'Invalid RFID',
			'access_not_permitted': 'Access Not Permitted',
			'invalid_resource': 'Invalid Resource',
			'server_error': 'Server Error',
			'Access granted': 'Access Granted',
			'Session started': 'Session Started',
			'Session ended': 'Session Ended',
			'Session completed': 'Session Completed'
		};
		return reasonMap[reason] || reason;
	}

	function exportLogs() {
		const headers = ['Timestamp', 'Status', 'User', 'User Email', 'Resource', 'Resource ID', 'Resource Type', 'RFID', 'Reason'];
		const csvData = [
			headers,
			...data.logs.map(log => [
				formatTimestamp(log.timestamp),
				log.success ? 'Success' : 'Failed',
				log.user_name || 'Unknown',
				log.user_email || '',
				log.resource_name,
				log.resource_id,
				log.resource_type,
				log.rfid,
				getReasonText(log.reason)
			])
		];
		
		const csv = csvData.map(row => 
			row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
		).join('\n');
		
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `access-logs-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Access Logs - MakerPass Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<PageHeader 
			title="Access Logs" 
			description="View and filter access activity across all resources"
		>
			<div slot="actions" class="flex space-x-2">
				<Button variant="secondary" on:click={exportLogs}>
					Export CSV
				</Button>
			</div>
		</PageHeader>
		
		<!-- Filters -->
		<div class="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Filters</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<div>
					<label for="resource_filter" class="block text-sm font-medium text-gray-700 mb-1">Resource</label>
					<select
						id="resource_filter"
						bind:value={resourceFilter}
						class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					>
						<option value="">All Resources</option>
						{#each data.resources as resource}
							<option value={resource.id}>{resource.name} ({resource.type})</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="user_filter" class="block text-sm font-medium text-gray-700 mb-1">User</label>
					<select
						id="user_filter"
						bind:value={userFilter}
						class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					>
						<option value="">All Users</option>
						{#each data.users as user}
							<option value={user.id}>{user.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="start_date_filter" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
					<input
						type="date"
						id="start_date_filter"
						bind:value={startDateFilter}
						class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="end_date_filter" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
					<input
						type="date"
						id="end_date_filter"
						bind:value={endDateFilter}
						class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="limit_filter" class="block text-sm font-medium text-gray-700 mb-1">Limit</label>
					<select
						id="limit_filter"
						bind:value={limitFilter}
						class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					>
						<option value={25}>25 records</option>
						<option value={50}>50 records</option>
						<option value={100}>100 records</option>
						<option value={200}>200 records</option>
					</select>
				</div>
			</div>
			
			<div class="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
				<Button variant="primary" on:click={applyFilters} class="w-full sm:w-auto">
					Apply Filters
				</Button>
				<Button variant="secondary" on:click={clearFilters} class="w-full sm:w-auto">
					Clear Filters
				</Button>
			</div>
		</div>

		<!-- Logs Table -->
		<div class="bg-white shadow overflow-hidden sm:rounded-md">
			{#if data.logs.length > 0}
				<!-- Mobile-friendly list view for small screens -->
				<div class="block sm:hidden">
					<ul class="divide-y divide-gray-200">
						{#each data.logs as log}
							<li class="px-4 py-4">
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<StatusBadge success={log.success} />
										<span class="text-xs text-gray-500">
											{formatTimestamp(log.timestamp)}
										</span>
									</div>
									<div class="text-sm">
										<div class="font-medium text-gray-900">
											{log.user_name || 'Unknown User'} → {log.resource_name}
										</div>
										<div class="text-gray-500 mt-1">
											<div class="break-all">RFID: {log.rfid}</div>
											<div>Resource: {log.resource_id}</div>
											<div>Reason: {getReasonText(log.reason)}</div>
										</div>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</div>
				
				<!-- Table view for larger screens -->
				<div class="hidden sm:block overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Timestamp
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									User
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Resource
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									RFID
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Reason
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each data.logs as log}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatTimestamp(log.timestamp)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<StatusBadge success={log.success} />
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">
											{log.user_name || 'Unknown'}
										</div>
										{#if log.user_email}
											<div class="text-sm text-gray-500">{log.user_email}</div>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">
											{log.resource_name}
										</div>
										<div class="text-sm text-gray-500">
											{log.resource_id} ({log.resource_type})
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
										{log.rfid}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{getReasonText(log.reason)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				
				{#if data.logs.length === limitFilter}
					<div class="bg-yellow-50 px-4 sm:px-6 py-3 border-t border-gray-200">
						<div class="text-sm text-yellow-700">
							Showing {data.logs.length} records (limit reached). Use filters to narrow results or increase the limit.
						</div>
					</div>
				{:else}
					<div class="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200">
						<div class="text-sm text-gray-600">
							Showing {data.logs.length} records
						</div>
					</div>
				{/if}
			{:else}
				<div class="px-4 sm:px-6 py-12 text-center">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No access logs</h3>
					<p class="mt-1 text-sm text-gray-500">
						No access attempts match your current filters.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
