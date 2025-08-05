<script>
	import { enhance } from '$app/forms';
	
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

	function formatRfid(rfid) {
		return rfid.toUpperCase();
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

		<!-- Users List -->
		<div class="bg-white shadow overflow-hidden sm:rounded-md">
			<ul class="divide-y divide-gray-200">
				{#each data.users as user}
					<li class="px-4 sm:px-6 py-4">
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
							<div class="min-w-0 flex-1">
								<div class="text-sm font-medium text-gray-900">{user.name}</div>
								<div class="text-sm text-gray-500 mt-1">
									<div class="break-all">RFID: {formatRfid(user.rfid)}</div>
									<div class="break-all">Email: {user.email}</div>
								</div>
								<div class="text-sm text-gray-500 mt-1">
									Access to: 
									{#if user.permissions.length > 0}
										{user.permissions.map(p => p.name).join(', ')}
									{:else}
										No resources
									{/if}
								</div>
							</div>
							<div class="flex items-center space-x-2 sm:flex-shrink-0">
								<button
									on:click={() => openEditModal(user)}
									class="text-gray-700 hover:text-gray-900 text-sm font-medium flex-1 sm:flex-none px-3 py-1 sm:px-0 sm:py-0"
								>
									Edit
								</button>
								<button
									on:click={() => confirmDelete(user.id, user.name)}
									class="text-red-600 hover:text-red-900 text-sm font-medium flex-1 sm:flex-none px-3 py-1 sm:px-0 sm:py-0"
								>
									Delete
								</button>
							</div>
						</div>
					</li>
				{:else}
					<li class="px-4 sm:px-6 py-4 text-center text-gray-500">
						No users configured yet
					</li>
				{/each}
			</ul>
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
					<label class="block text-sm font-medium text-gray-700 mb-2">Resource Access</label>
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
					<label class="block text-sm font-medium text-gray-700 mb-2">Resource Access</label>
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
