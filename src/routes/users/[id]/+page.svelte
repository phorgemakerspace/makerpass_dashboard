<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	
	export let data;
	export let form;

	let editMode = false;
	let showDeleteConfirm = false;

	function toggleEditMode() {
		editMode = !editMode;
	}

	function formatRfid(rfid) {
		return rfid.toUpperCase();
	}

	function formatDate(dateString) {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleString();
	}

	function formatDateShort(dateString) {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleDateString();
	}

	function getStatusBadge(enabled) {
		return enabled 
			? { class: 'bg-green-100 text-green-800', text: 'Active' }
			: { class: 'bg-red-100 text-red-800', text: 'Disabled' };
	}

	function getSubscriptionBadge(type) {
		if (!type) return { class: 'bg-gray-100 text-gray-800', text: 'No Subscription' };
		
		// Common subscription type mappings (case insensitive)
		const typeNormalized = type.toLowerCase();
		const badges = {
			'basic': { class: 'bg-blue-100 text-blue-800', text: 'Basic' },
			'premium': { class: 'bg-purple-100 text-purple-800', text: 'Premium' },
			'pro': { class: 'bg-indigo-100 text-indigo-800', text: 'Pro' },
			'starter': { class: 'bg-green-100 text-green-800', text: 'Starter' },
			'monthly': { class: 'bg-blue-100 text-blue-800', text: 'Monthly' },
			'yearly': { class: 'bg-purple-100 text-purple-800', text: 'Yearly' },
			'annual': { class: 'bg-purple-100 text-purple-800', text: 'Annual' },
		};
		
		// Return predefined badge or create a generic one for Stripe subscription names
		return badges[typeNormalized] || { 
			class: 'bg-orange-100 text-orange-800', 
			text: type.charAt(0).toUpperCase() + type.slice(1) 
		};
	}

	function confirmDelete() {
		showDeleteConfirm = true;
	}

	function cancelDelete() {
		showDeleteConfirm = false;
	}

	// Check if user has specific permission
	function hasPermission(resourceId) {
		return data.user.permissions.some(p => p.id === resourceId);
	}

	$: isStripeEnabled = data.settings?.stripe_enabled === 'true';
</script>

<svelte:head>
	<title>{data.user.name} - Users - MakerPass Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<!-- Header with breadcrumb -->
		<div class="mb-6">
			<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-4">
				<a href="/users" class="hover:text-gray-700">Users</a>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
				</svg>
				<span class="text-gray-900">{data.user.name}</span>
			</nav>

			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
				<div>
					<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{data.user.name}</h1>
					<p class="text-gray-600 mt-1">{data.user.email}</p>
				</div>
				<div class="flex items-center space-x-3">
					{#if true}
						{@const status = getStatusBadge(data.user.enabled)}
						<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {status.class}">
							{status.text}
						</span>
					{/if}
					<button
						on:click={toggleEditMode}
						class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
					>
						{editMode ? 'Cancel Edit' : 'Edit User'}
					</button>
				</div>
			</div>
		</div>

		{#if form?.error}
			<div class="mb-6 rounded-md bg-red-50 p-4">
				<div class="text-sm text-red-700">
					{form.error}
				</div>
			</div>
		{/if}

		{#if form?.success}
			<div class="mb-6 rounded-md bg-green-50 p-4">
				<div class="text-sm text-green-700">
					{form.message}
				</div>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main Info -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Basic Information -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200">
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900">Basic Information</h2>
					</div>
					<div class="p-6">
						{#if editMode}
							<form method="POST" action="?/updateUser" use:enhance class="space-y-4">
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label for="name" class="block text-sm font-medium text-gray-700 mb-2">Name</label>
										<input
											type="text"
											id="name"
											name="name"
											value={data.user.name}
											required
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
										<input
											type="email"
											id="email"
											name="email"
											value={data.user.email}
											required
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label for="rfid" class="block text-sm font-medium text-gray-700 mb-2">RFID (8 hex characters)</label>
										<input
											type="text"
											id="rfid"
											name="rfid"
											value={data.user.rfid}
											required
											maxlength="8"
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
										/>
									</div>
									<div>
										<label for="enabled" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
										<select
											id="enabled"
											name="enabled"
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="true" selected={data.user.enabled}>Active</option>
											<option value="false" selected={!data.user.enabled}>Disabled</option>
										</select>
									</div>
								</div>

								<div>
									<label for="address" class="block text-sm font-medium text-gray-700 mb-2">Address</label>
									<textarea
										id="address"
										name="address"
										rows="3"
										value={data.user.address || ''}
										class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Enter address (optional)"
									></textarea>
								</div>

								<div class="flex justify-end space-x-3">
									<button
										type="button"
										on:click={toggleEditMode}
										class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
									>
										Cancel
									</button>
									<button
										type="submit"
										class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md"
									>
										Save Changes
									</button>
								</div>
							</form>
						{:else}
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<div>
									<dt class="text-sm font-medium text-gray-500">Name</dt>
									<dd class="text-sm text-gray-900 mt-1">{data.user.name}</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-500">Email</dt>
									<dd class="text-sm text-gray-900 mt-1">{data.user.email}</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-500">RFID</dt>
									<dd class="text-sm text-gray-900 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
										{formatRfid(data.user.rfid)}
									</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-500">Status</dt>
									<dd class="mt-1">
										{#if true}
											{@const status = getStatusBadge(data.user.enabled)}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {status.class}">
												{status.text}
											</span>
										{/if}
									</dd>
								</div>
								{#if data.user.address}
									<div class="sm:col-span-2">
										<dt class="text-sm font-medium text-gray-500">Address</dt>
										<dd class="text-sm text-gray-900 mt-1">{data.user.address}</dd>
									</div>
								{/if}
								<div>
									<dt class="text-sm font-medium text-gray-500">Created</dt>
									<dd class="text-sm text-gray-900 mt-1">{formatDate(data.user.created_at)}</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
									<dd class="text-sm text-gray-900 mt-1">{formatDate(data.user.updated_at)}</dd>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Stripe Information (if enabled) -->
				{#if isStripeEnabled}
					<div class="bg-white rounded-lg shadow-sm border border-gray-200">
						<div class="px-6 py-4 border-b border-gray-200">
							<div class="flex items-center justify-between">
								<h2 class="text-lg font-semibold text-gray-900">Stripe Subscription</h2>
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									Managed by Stripe
								</span>
							</div>
						</div>
						<div class="p-6">
							{#if data.user.customer_id}
								<!-- Show Stripe fields only when user is connected -->
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<div>
										<dt class="text-sm font-medium text-gray-500">Stripe Customer ID</dt>
										<dd class="text-sm text-gray-900 mt-1">
											<span class="font-mono text-sm bg-gray-50 px-2 py-1 rounded">{data.user.customer_id}</span>
										</dd>
									</div>
									<div>
										<dt class="text-sm font-medium text-gray-500">Subscription Status</dt>
										<dd class="mt-1">
											{#if data.user.subscription_type}
												{@const subscription = getSubscriptionBadge(data.user.subscription_type)}
												<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {subscription.class}">
													{subscription.text}
												</span>
											{:else}
												<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
													No Subscription
												</span>
											{/if}
										</dd>
									</div>
									{#if data.user.subscription_expires}
										<div>
											<dt class="text-sm font-medium text-gray-500">Subscription Expires</dt>
											<dd class="text-sm text-gray-900 mt-1">{formatDateShort(data.user.subscription_expires)}</dd>
										</div>
									{/if}
									<div>
										<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
										<dd class="text-sm text-gray-900 mt-1">{formatDate(data.user.updated_at)}</dd>
									</div>
								</div>
							{:else}
								<!-- Show only the "not connected" message when no Stripe connection -->
								<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
									<div class="flex">
										<div class="flex-shrink-0">
											<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
											</svg>
										</div>
										<div class="ml-3">
											<h3 class="text-sm font-medium text-yellow-800">Not Connected to Stripe</h3>
											<div class="mt-2 text-sm text-yellow-700">
												<p>This user is not connected to a Stripe customer. Subscription information will appear here automatically when they subscribe through Stripe.</p>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Resource Access -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200">
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900">Resource Access</h2>
					</div>
					<div class="p-6">
						{#if editMode}
							<div class="space-y-3 max-h-64 overflow-y-auto">
								{#each data.allResources as resource}
									<label class="flex items-start space-x-3">
										<input
											type="checkbox"
											name="resource_permissions"
											value={resource.id}
											checked={hasPermission(resource.id)}
											class="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
										/>
										<div class="min-w-0 flex-1">
											<div class="text-sm font-medium text-gray-900">{resource.name}</div>
											<div class="text-xs text-gray-500">{resource.type}</div>
											{#if resource.description}
												<div class="text-xs text-gray-400 mt-1">{resource.description}</div>
											{/if}
										</div>
									</label>
								{/each}
							</div>
						{:else}
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{#each data.user.permissions as permission}
									<div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
										<div class="flex-shrink-0">
											<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
												<svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
												</svg>
											</div>
										</div>
										<div class="min-w-0 flex-1">
											<div class="text-sm font-medium text-gray-900">{permission.name}</div>
											<div class="text-xs text-gray-500">{permission.type}</div>
										</div>
									</div>
								{:else}
									<div class="col-span-full text-center py-8">
										<div class="text-gray-400">
											<svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
											</svg>
										</div>
										<h3 class="text-sm font-medium text-gray-900">No Resource Access</h3>
										<p class="text-sm text-gray-500">This user doesn't have access to any resources.</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Recent Activity -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200">
					<div class="px-6 py-4 border-b border-gray-200">
						<h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
					</div>
					<div class="p-6">
						{#if data.recentActivity.length > 0}
							<div class="space-y-3">
								{#each data.recentActivity as activity}
									<div class="flex items-center space-x-3">
										<div class="flex-shrink-0">
											<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
												<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
												</svg>
											</div>
										</div>
										<div class="min-w-0 flex-1">
											<div class="text-sm font-medium text-gray-900">{activity.resource_name}</div>
											<div class="text-xs text-gray-500">{activity.resource_type}</div>
											<div class="text-xs text-gray-400">{formatDate(activity.timestamp)}</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-6">
								<div class="text-gray-400">
									<svg class="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								<p class="text-sm text-gray-500">No recent activity</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Danger Zone -->
				<div class="bg-white rounded-lg shadow-sm border border-red-200">
					<div class="px-6 py-4 border-b border-red-200">
						<h3 class="text-lg font-semibold text-red-900">Danger Zone</h3>
					</div>
					<div class="p-6">
						<div class="text-sm text-gray-600 mb-4">
							Permanently delete this user and all associated data. This action cannot be undone.
						</div>
						<button
							on:click={confirmDelete}
							class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
						>
							Delete User
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" on:click={cancelDelete}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white" on:click|stopPropagation>
			<div class="text-center">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
					<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
				<p class="text-sm text-gray-500 mb-6">
					Are you sure you want to delete <strong>{data.user.name}</strong>? This action cannot be undone and will permanently remove all user data and access logs.
				</p>
				<div class="flex justify-center space-x-3">
					<button
						on:click={cancelDelete}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<form method="POST" action="?/deleteUser" use:enhance class="inline">
						<button
							type="submit"
							class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
						>
							Delete User
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
