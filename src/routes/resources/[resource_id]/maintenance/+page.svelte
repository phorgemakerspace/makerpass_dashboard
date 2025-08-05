<script>
	import { formatDateTime } from '$lib/utils.js';

	export let data;
	const { resource, maintenanceEvents, maintenanceIntervals } = data;

	function formatMaintenanceType(type) {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	function getIntervalName(intervalId) {
		const interval = maintenanceIntervals.find(i => i.id === intervalId);
		return interval ? interval.name : 'Unknown Interval';
	}

	// Group events by year-month for better organization
	const groupedEvents = maintenanceEvents.reduce((groups, event) => {
		const date = new Date(event.maintenance_date);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(event);
		return groups;
	}, {});

	const sortedKeys = Object.keys(groupedEvents).sort().reverse();
</script>

<svelte:head>
	<title>Maintenance Logs - {resource.name} | MakerPass Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-4">
				<a href="/" class="hover:text-gray-700">Dashboard</a>
				<span>/</span>
				<a href="/resources" class="hover:text-gray-700">Resources</a>
				<span>/</span>
				<a href="/resources/{resource.resource_id}" class="hover:text-gray-700">{resource.name}</a>
				<span>/</span>
				<span class="text-gray-900">Maintenance Logs</span>
			</nav>
			
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Maintenance Logs</h1>
					<p class="text-gray-600 mt-1">{resource.name} • Complete maintenance history</p>
				</div>
				<a 
					href="/resources/{resource.resource_id}" 
					class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
				>
					← Back to Resource
				</a>
			</div>
		</div>

		<!-- Summary Statistics -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div class="bg-white rounded-lg shadow border p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="text-sm font-medium text-gray-500 truncate">Total Events</dt>
							<dd class="text-lg font-medium text-gray-900">{maintenanceEvents.length}</dd>
						</dl>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow border p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="text-sm font-medium text-gray-500 truncate">Active Intervals</dt>
							<dd class="text-lg font-medium text-gray-900">{maintenanceIntervals.length}</dd>
						</dl>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow border p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="text-sm font-medium text-gray-500 truncate">Last Maintenance</dt>
							<dd class="text-lg font-medium text-gray-900">
								{#if maintenanceEvents.length > 0}
									{formatDateTime(maintenanceEvents[0].maintenance_date).split(' at ')[0]}
								{:else}
									Never
								{/if}
							</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>

		<!-- Maintenance Events -->
		<div class="bg-white rounded-lg shadow border">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-medium text-gray-900">All Maintenance Events</h2>
				<p class="text-sm text-gray-500 mt-1">Complete chronological history</p>
			</div>

			{#if maintenanceEvents.length === 0}
				<div class="px-6 py-8 text-center text-gray-500">
					<svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<p class="text-lg font-medium">No maintenance events recorded</p>
					<p class="text-sm text-gray-400 mt-1">Start logging maintenance to see history here</p>
				</div>
			{:else}
				<div class="divide-y divide-gray-200">
					{#each sortedKeys as monthKey}
						{@const monthEvents = groupedEvents[monthKey]}
						{@const [year, month] = monthKey.split('-')}
						{@const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
						
						<div class="px-6 py-4">
							<h3 class="text-sm font-medium text-gray-700 mb-4 sticky top-0 bg-white py-2 border-b border-gray-100">
								{monthName} ({monthEvents.length} event{monthEvents.length === 1 ? '' : 's'})
							</h3>
							
							<div class="space-y-4">
								{#each monthEvents as event}
									<div class="bg-gray-50 rounded-lg p-4 border">
										<div class="flex justify-between items-start">
											<div class="flex-1">
												<div class="flex items-center space-x-2 mb-2">
													<h4 class="text-sm font-medium text-gray-900">
														{event.interval_name || getIntervalName(event.interval_id) || 'General Maintenance'}
													</h4>
													<span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
														{formatMaintenanceType(event.maintenance_type)}
													</span>
												</div>
												
												<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
													<div>
														<span class="font-medium">Date:</span> 
														{formatDateTime(event.maintenance_date)}
													</div>
													{#if event.performed_by_name}
														<div>
															<span class="font-medium">Performed by:</span> 
															{event.performed_by_name}
														</div>
													{/if}
												</div>
											</div>
										</div>
										
										{#if event.notes}
											<div class="mt-3 bg-white rounded p-3 border">
												<span class="text-xs font-medium text-gray-500 block mb-1">Notes:</span>
												<p class="text-sm text-gray-700 leading-relaxed">{event.notes}</p>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Quick Actions -->
		<div class="mt-8 flex justify-center">
			<a 
				href="/maintenance" 
				class="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
			>
				Log New Maintenance
			</a>
		</div>
	</div>
</div>
