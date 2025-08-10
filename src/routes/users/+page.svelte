<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	
	export let data;
	export let form;

	let showAddModal = false;
	let editingUser = null;

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
</script>

<svelte:head>
	<title>Users - MakerPass Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
			<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
			<button
				on:click={openAddModal}
				class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
			>
				Add User
			</button>
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

		<!-- Users Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
			{#each data.users as user}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
					<div class="p-4 sm:p-6">
						<!-- User Header -->
						<div class="flex items-start justify-between mb-3">
							<div class="flex-1 min-w-0">
								<h3 class="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
								<p class="text-sm text-gray-500 truncate">{user.email}</p>
							</div>
							<div class="ml-2">
								{#if true}
									{@const status = getStatusBadge(user.enabled ?? true)}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {status.class}">
										{status.text}
									</span>
								{/if}
							</div>
						</div>

						<!-- RFID -->
						<div class="mb-3">
							<p class="text-sm text-gray-500">RFID</p>
							<p class="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
								{formatRfid(user.rfid)}
							</p>
						</div>

						<!-- Resource Access -->
						<div class="mb-4">
							<p class="text-sm text-gray-500 mb-1">Resource Access</p>
							{#if getResourceCount(user.permissions) > 0}
								{@const resourceCount = getResourceCount(user.permissions)}
								<div class="flex items-center text-sm">
									<svg class="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
									<span class="text-green-700">{resourceCount} resource{resourceCount !== 1 ? 's' : ''}</span>
								</div>
							{:else}
								<div class="flex items-center text-sm">
									<svg class="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
									</svg>
									<span class="text-red-600">No access</span>
								</div>
							{/if}
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center space-x-2">
							<button
								on:click={() => viewUserDetails(user.id)}
								class="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
							>
								View Details
							</button>
							<button
								on:click={() => toggleUserStatus(user.id, user.enabled ?? true)}
								class="px-3 py-2 rounded-md text-sm font-medium transition-colors {user.enabled ?? true 
									? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
									: 'bg-green-50 text-green-700 hover:bg-green-100'}"
								title={user.enabled ?? true ? 'Disable User' : 'Enable User'}
							>
								{user.enabled ?? true ? 'Disable' : 'Enable'}
							</button>
							<button
								on:click={() => confirmDelete(user.id, user.name)}
								class="px-3 py-2 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
								title="Delete User"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="col-span-full">
					<div class="text-center py-12">
						<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 01-3 0m3 0V9a9 9 0 10-18 0v12.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 01-3 0" />
						</svg>
						<h3 class="mt-2 text-sm font-medium text-gray-900">No users</h3>
						<p class="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
						<div class="mt-6">
							<button
								on:click={openAddModal}
								class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium"
							>
								Add First User
							</button>
						</div>
					</div>
				</div>
			{/each}
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
