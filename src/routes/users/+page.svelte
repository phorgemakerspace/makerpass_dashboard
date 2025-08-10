<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	
	export let data;
	export let form;

	let showAddModal = false;
	let editingUser = null;
	let searchTerm = '';

	function openAddModal() {
		showAddModal = true;
	}

	function closeAddModal() {
		showAddModal = false;
	}

	function openEditModal(user) {
		editingUser = {
			...user,
			selectedPermissions: user.permissions.map(p => p.id.toString())
		};
	}

	function closeEditModal() {
		editingUser = null;
	}

	function confirmDelete(userId, userName) {
		if (confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/delete';
			
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'id';
			input.value = userId;
			
			form.appendChild(input);
			document.body.appendChild(form);
			form.submit();
		}
	}

	function toggleUserStatus(userId, currentStatus) {
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/toggleStatus';
		
		const idInput = document.createElement('input');
		idInput.type = 'hidden';
		idInput.name = 'id';
		idInput.value = userId;
		
		const statusInput = document.createElement('input');
		statusInput.type = 'hidden';
		statusInput.name = 'enabled';
		statusInput.value = (!currentStatus).toString();
		
		form.appendChild(idInput);
		form.appendChild(statusInput);
		document.body.appendChild(form);
		form.submit();
	}

	function viewUserDetails(userId) {
		goto(`/users/${userId}`);
	}

	function formatRfid(rfid) {
		return rfid.toUpperCase();
	}

	function getStatusBadge(enabled) {
		return enabled 
			? { class: 'bg-green-100 text-green-800', text: 'Active' }
			: { class: 'bg-red-100 text-red-800', text: 'Disabled' };
	}

	function getResourceCount(permissions) {
		return permissions.length;
	}

	// Filter users based on search term
	$: filteredUsers = data.users.filter(user => 
		user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.email.toLowerCase().includes(searchTerm.toLowerCase())
	);
</script>

<svelte:head>
	<title>Users - MakerPass Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
			<div class="flex-1">
				<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
				<p class="text-gray-600 mt-1">Manage user accounts and permissions</p>
			</div>
			<button
				on:click={openAddModal}
				class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium"
			>
				Add User
			</button>
		</div>

		<!-- Search Bar -->
		<div class="mb-6">
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Search users by name or email..."
					class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>
		</div>

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
					Operation completed successfully!
				</div>
			</div>
		{/if}

		<!-- Users List -->
		<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
			{#if filteredUsers.length === 0}
				<div class="p-8 text-center">
					<div class="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
						<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
						</svg>
					</div>
					{#if searchTerm}
						<h3 class="text-sm font-medium text-gray-900 mb-1">No users found</h3>
						<p class="text-sm text-gray-500">Try adjusting your search criteria</p>
					{:else}
						<h3 class="text-sm font-medium text-gray-900 mb-1">No users yet</h3>
						<p class="text-sm text-gray-500 mb-4">Get started by adding your first user</p>
						<button
							on:click={openAddModal}
							class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium"
						>
							Add User
						</button>
					{/if}
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									User
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
									RFID
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
									Access
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each filteredUsers as user (user.id)}
								<tr class="hover:bg-gray-50 transition-colors">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<div class="relative">
												<div class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
													<span class="text-sm font-medium text-blue-800">
														{user.name?.charAt(0).toUpperCase() || 'U'}
													</span>
												</div>
												{#if data.stripeEnabled}
													{#if user.customer_id}
														<!-- Stripe user badge -->
														<div class="absolute -top-1 -right-1 h-4 w-4 bg-purple-500 rounded-full flex items-center justify-center" title="Stripe Customer">
															<svg class="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
																<path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
															</svg>
														</div>
													{:else}
														<!-- Manual user badge -->
														<div class="absolute -top-1 -right-1 h-4 w-4 bg-gray-500 rounded-full flex items-center justify-center" title="Manual User">
															<svg class="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
																<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
															</svg>
														</div>
													{/if}
												{/if}
											</div>
											<div class="ml-4">
												<button 
													on:click={() => viewUserDetails(user.id)}
													class="text-left hover:text-blue-600 transition-colors"
												>
													<div class="flex items-center">
														<div class="text-sm font-medium text-gray-900 hover:text-blue-600">
															{user.name || 'Unknown User'}
														</div>
														{#if data.stripeEnabled && user.customer_id}
															<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																Stripe
															</span>
														{/if}
													</div>
													<div class="text-sm text-gray-500">{user.email}</div>
												</button>
											</div>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
										<span class="font-mono bg-gray-50 px-2 py-1 rounded">
											{formatRfid(user.rfid)}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
										{#if getResourceCount(user.permissions) > 0}
											{@const resourceCount = getResourceCount(user.permissions)}
											<div class="flex items-center">
												<svg class="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
												</svg>
												<span class="text-green-700">{resourceCount} resource{resourceCount !== 1 ? 's' : ''}</span>
											</div>
										{:else}
											<div class="flex items-center">
												<svg class="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
												</svg>
												<span class="text-red-600">No access</span>
											</div>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<label class="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												checked={user.enabled ?? true}
												on:change={() => toggleUserStatus(user.id, user.enabled ?? true)}
												class="sr-only peer"
											/>
											<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
											<span class="ml-3 text-sm font-medium text-gray-700">
												{user.enabled ?? true ? 'Enabled' : 'Disabled'}
											</span>
										</label>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Add User Modal -->
{#if showAddModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" on:click={closeAddModal}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" on:click|stopPropagation>
			<h3 class="text-lg font-bold text-gray-900 mb-4">Add New User</h3>
			<form method="POST" action="?/create" use:enhance on:submit={closeAddModal}>
				<div class="mb-4">
					<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div class="mb-4">
					<label for="rfid" class="block text-sm font-medium text-gray-700">RFID (8 hex characters)</label>
					<input
						type="text"
						id="rfid"
						name="rfid"
						required
						maxlength="8"
						placeholder="A1B2C3D4"
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
					/>
				</div>

				<div class="mb-4">
					<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div class="mb-4">
					<fieldset>
						<legend class="block text-sm font-medium text-gray-700 mb-2">Resource Access</legend>
						<div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
							{#each data.resources as resource}
								<label class="flex items-center">
									<input
										type="checkbox"
										name="resource_permissions"
										value={resource.id}
										class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
									/>
									<span class="ml-2 text-sm text-gray-700">
										{resource.name} ({resource.type})
									</span>
								</label>
							{/each}
						</div>
					</fieldset>
				</div>

				<div class="flex justify-end space-x-2">
					<button
						type="button"
						on:click={closeAddModal}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md"
					>
						Add User
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit User Modal -->
{#if editingUser}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" on:click={closeEditModal}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" on:click|stopPropagation>
			<h3 class="text-lg font-bold text-gray-900 mb-4">Edit User</h3>
			<form method="POST" action="?/update" use:enhance on:submit={closeEditModal}>
				<input type="hidden" name="id" value={editingUser.id} />
				
				<div class="mb-4">
					<label for="edit_name" class="block text-sm font-medium text-gray-700">Name</label>
					<input
						type="text"
						id="edit_name"
						name="name"
						value={editingUser.name}
						required
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div class="mb-4">
					<label for="edit_rfid" class="block text-sm font-medium text-gray-700">RFID (8 hex characters)</label>
					<input
						type="text"
						id="edit_rfid"
						name="rfid"
						value={editingUser.rfid}
						required
						maxlength="8"
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
					/>
				</div>

				<div class="mb-4">
					<label for="edit_email" class="block text-sm font-medium text-gray-700">Email</label>
					<input
						type="email"
						id="edit_email"
						name="email"
						value={editingUser.email}
						required
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div class="mb-4">
					<fieldset>
						<legend class="block text-sm font-medium text-gray-700 mb-2">Resource Access</legend>
						<div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
							{#each data.resources as resource}
								<label class="flex items-center">
									<input
										type="checkbox"
										name="resource_permissions"
										value={resource.id}
										checked={editingUser.selectedPermissions.includes(resource.id.toString())}
										class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
									/>
									<span class="ml-2 text-sm text-gray-700">
										{resource.name} ({resource.type})
									</span>
								</label>
							{/each}
						</div>
					</fieldset>
				</div>

				<div class="flex justify-end space-x-2">
					<button
						type="button"
						on:click={closeEditModal}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md"
					>
						Update User
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
