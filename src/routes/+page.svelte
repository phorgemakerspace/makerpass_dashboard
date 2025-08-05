<script>
	export let data;
	
	function formatTimestamp(timestamp) {
		return new Date(timestamp).toLocaleString();
	}
	
	function getStatusBadgeClass(success) {
		return success 
			? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
			: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
	}
</script>

<svelte:head>
	<title>Dashboard - MakerPass</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Dashboard</h1>
		
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
			<!-- Total Users -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V9a3 3 0 00-6 0v2.5a.5.5 0 001 0V9a2 2 0 014 0v7.5a2 2 0 01-4 0V16"/>
							</svg>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
								<dd class="text-lg font-medium text-gray-900">{data.stats.totalUsers}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<!-- Total Resources -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
							</svg>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Total Resources</dt>
								<dd class="text-lg font-medium text-gray-900">{data.stats.totalResources}</dd>
								<dd class="text-sm text-gray-500">{data.stats.doors} doors, {data.stats.machines} machines</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<!-- Today's Access -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Today's Access</dt>
								<dd class="text-lg font-medium text-gray-900">{data.stats.successfulToday + data.stats.failedToday}</dd>
								<dd class="text-sm text-gray-500">{data.stats.successfulToday} successful, {data.stats.failedToday} failed</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Recent Access Logs -->
		<div class="mt-6 sm:mt-8">
			<h2 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Access Attempts</h2>
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<ul class="divide-y divide-gray-200">
					{#each data.recentLogs as log}
						<li class="px-4 sm:px-6 py-4">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
								<div class="flex items-start sm:items-center">
									<div class="flex-shrink-0">
										<span class={getStatusBadgeClass(log.success)}>
											{log.success ? 'Success' : 'Failed'}
										</span>
									</div>
									<div class="ml-3 sm:ml-4 min-w-0 flex-1">
										<div class="text-sm font-medium text-gray-900 truncate">
											{log.user_name || 'Unknown User'} → {log.resource_name}
										</div>
										<div class="text-sm text-gray-500 mt-1">
											<div class="break-all">RFID: {log.rfid}</div>
											<div>Resource: {log.resource_id} | {log.reason}</div>
										</div>
									</div>
								</div>
								<div class="text-sm text-gray-500 ml-8 sm:ml-0 sm:text-right">
									{formatTimestamp(log.timestamp)}
								</div>
							</div>
						</li>
					{:else}
						<li class="px-4 sm:px-6 py-4 text-center text-gray-500">
							No access logs yet
						</li>
					{/each}
				</ul>
			</div>
			{#if data.recentLogs.length > 0}
				<div class="mt-4 text-center">
					<a href="/logs" class="text-gray-700 hover:text-gray-900 text-sm font-medium">
						View all access logs →
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
