<script>
	import { enhance } from '$app/forms';
	
	export let data;
	export let form;

	let showAddModal = false;
	let editingResource = null;
	
	// Form state for add modal
	let addResourceType = '';
	let addCardRequired = false;
	
	// Form state for edit modal
	let editResourceType = '';
	let editCardRequired = false;

	function openAddModal() {
		showAddModal = true;
		addResourceType = '';
		addCardRequired = false;
	}

	function closeAddModal() {
		showAddModal = false;
		addResourceType = '';
		addCardRequired = false;
	}

	function openEditModal(resource) {
		editingResource = resource;
		editResourceType = resource.type;
		editCardRequired = Boolean(resource.card_present_required);
	}

	function closeEditModal() {
		editingResource = null;
		editResourceType = '';
		editCardRequired = false;
	}

	// Clear card required when type changes away from machine
	function handleAddTypeChange() {
		if (addResourceType !== 'machine') {
			addCardRequired = false;
		}
	}

	function handleEditTypeChange() {
		if (editResourceType !== 'machine') {
			editCardRequired = false;
		}
	}

	function confirmDelete(resourceId, resourceName) {
		if (confirm(`Are you sure you want to delete "${resourceName}"? This action cannot be undone.`)) {
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/delete';
			
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'id';
			input.value = resourceId;
			
			form.appendChild(input);
			document.body.appendChild(form);
			form.submit();
		}
	}
</script>

<svelte:head>
	<title>Resources - MakerPass Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
			<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Resources</h1>
			<button
				on:click={openAddModal}
				class="btn-primary hover:opacity-90 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
			>
				Add Resource
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

		<!-- Doors Section -->
		<div class="mb-6 sm:mb-8">
			<h2 class="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Doors ({data.doors.length})</h2>
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<ul class="divide-y divide-gray-200">
					{#each data.doors as door}
						<li class="px-4 sm:px-6 py-4">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
								<div class="min-w-0 flex-1">
									<div class="text-sm font-medium text-gray-900">{door.name}</div>
									<div class="text-sm text-gray-500 break-all">ID: {door.resource_id}</div>
								</div>
								<div class="flex items-center space-x-2 sm:flex-shrink-0">
									<button
										on:click={() => openEditModal(door)}
										class="text-gray-700 hover:text-gray-900 text-sm font-medium flex-1 sm:flex-none px-3 py-1 sm:px-0 sm:py-0"
									>
										Edit
									</button>
									<button
										on:click={() => confirmDelete(door.id, door.name)}
										class="text-red-600 hover:text-red-900 text-sm font-medium flex-1 sm:flex-none px-3 py-1 sm:px-0 sm:py-0"
									>
										Delete
									</button>
								</div>
							</div>
						</li>
					{:else}
						<li class="px-4 sm:px-6 py-4 text-center text-gray-500">
							No doors configured yet
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Machines Section -->
		<div>
			<h2 class="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Machines ({data.machines.length})</h2>
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<ul class="divide-y divide-gray-200">
					{#each data.machines as machine}
						<li class="px-4 sm:px-6 py-4">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
								<div class="min-w-0 flex-1">
									<div class="text-sm font-medium text-gray-900">{machine.name}</div>
									<div class="text-sm text-gray-500 mt-1">
										<div class="break-all">ID: {machine.resource_id}</div>
										{#if machine.card_present_required}
											<span class="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
												Card Required
											</span>
										{/if}
									</div>
								</div>
								<div class="flex items-center space-x-2 sm:flex-shrink-0">
									<button
										on:click={() => openEditModal(machine)}
										class="text-gray-700 hover:text-gray-900 text-sm font-medium flex-1 sm:flex-none px-3 py-1 sm:px-0 sm:py-0"
									>
										Edit
									</button>
									<button
										on:click={() => confirmDelete(machine.id, machine.name)}
										class="text-red-600 hover:text-red-900 text-sm font-medium flex-1 sm:flex-none px-3 py-1 sm:px-0 sm:py-0"
									>
										Delete
									</button>
								</div>
							</div>
						</li>
					{:else}
						<li class="px-4 sm:px-6 py-4 text-center text-gray-500">
							No machines configured yet
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</div>

<!-- Add Resource Modal -->
{#if showAddModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" on:click={closeAddModal}>
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" on:click|stopPropagation>
			<h3 class="text-lg font-bold text-gray-900 mb-4">Add New Resource</h3>
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
					<label for="type" class="block text-sm font-medium text-gray-700">Type</label>
					<select
						id="type"
						name="type"
						bind:value={addResourceType}
						on:change={handleAddTypeChange}
						required
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					>
						<option value="">Select type</option>
						<option value="door">Door</option>
						<option value="machine">Machine</option>
					</select>
				</div>

				{#if addResourceType === 'machine'}
					<div class="mb-4">
						<label class="flex items-center">
							<input
								type="checkbox"
								name="card_present_required"
								bind:checked={addCardRequired}
								class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
							/>
							<span class="ml-2 text-sm text-gray-700">Card must be present</span>
						</label>
					</div>
				{/if}

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
						class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
					>
						Add Resource
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Resource Modal -->
{#if editingResource}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" on:click={closeEditModal}>
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" on:click|stopPropagation>
			<h3 class="text-lg font-bold text-gray-900 mb-4">Edit Resource</h3>
			<form method="POST" action="?/update" use:enhance on:submit={closeEditModal}>
				<input type="hidden" name="id" value={editingResource.id} />
				
				<div class="mb-4">
					<label for="edit_name" class="block text-sm font-medium text-gray-700">Name</label>
					<input
						type="text"
						id="edit_name"
						name="name"
						value={editingResource.name}
						required
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div class="mb-4">
					<label for="edit_type" class="block text-sm font-medium text-gray-700">Type</label>
					<select
						id="edit_type"
						name="type"
						bind:value={editResourceType}
						on:change={handleEditTypeChange}
						required
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					>
						<option value="door">Door</option>
						<option value="machine">Machine</option>
					</select>
				</div>

				{#if editResourceType === 'machine'}
					<div class="mb-4">
						<label class="flex items-center">
							<input
								type="checkbox"
								name="card_present_required"
								bind:checked={editCardRequired}
								class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
							/>
							<span class="ml-2 text-sm text-gray-700">Card must be present</span>
						</label>
					</div>
				{/if}

				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700">Resource ID</label>
					<input
						type="text"
						value={editingResource.resource_id}
						disabled
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
					/>
					<p class="mt-1 text-sm text-gray-500">Resource ID cannot be changed</p>
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
						class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
					>
						Update Resource
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
