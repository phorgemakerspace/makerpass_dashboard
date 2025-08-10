<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	
	export let data;
	export let form;

	let showAddModal = false;
	let showEditModal = false;
	let editingResource = null;
	let doorsCollapsed = false;
	let machinesCollapsed = false;
	let machineCategoryCollapsed = {};
	let newResource = {
		name: '',
		type: 'door',
		category: '',
		require_card_present: false,
		enabled: true
	};

	// Categories for machines
	const machineCategories = [
		'3D Printer',
		'Laser Cutter', 
		'CNC Machine',
		'Woodworking',
		'Electronics',
		'Textile',
		'Metalworking',
		'Other'
	];

	function openAddModal() {
		newResource = {
			name: '',
			type: 'door',
			category: '',
			require_card_present: false,
			enabled: true
		};
		showAddModal = true;
	}

	function openEditModal(resource) {
		editingResource = { ...resource };
		showEditModal = true;
	}

	function closeModals() {
		showAddModal = false;
		showEditModal = false;
		editingResource = null;
	}

	async function toggleResourceStatus(resourceId, currentStatus) {
		const formData = new FormData();
		formData.append('id', resourceId);
		formData.append('enabled', (!currentStatus).toString());
		
		const response = await fetch('?/toggleStatus', {
			method: 'POST',
			body: formData
		});
		
		if (response.ok) {
			invalidateAll();
		}
	}

	function getConnectionStatusColor(status) {
		return status === 'online' ? 'text-green-600' : 'text-gray-400';
	}

	function getConnectionStatusIcon(status) {
		return status === 'online' ? '●' : '○';
	}

	function toggleDoorsSection() {
		doorsCollapsed = !doorsCollapsed;
	}

	function toggleMachinesSection() {
		machinesCollapsed = !machinesCollapsed;
	}

	function toggleMachineCategory(category) {
		machineCategoryCollapsed[category] = !machineCategoryCollapsed[category];
		machineCategoryCollapsed = { ...machineCategoryCollapsed };
	}
</script>

<svelte:head>
	<title>Resources - MakerPass Dashboard</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<PageHeader 
			title="Resources" 
			description="Manage doors and machines in your makerspace"
		>
			<div slot="actions">
				<Button variant="primary" on:click={openAddModal}>
					Add Resource
				</Button>
			</div>
		</PageHeader>

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
					{form.message}
				</div>
			</div>
		{/if}

		<!-- Doors Section -->
		<div class="mb-8">
			<button
				on:click={toggleDoorsSection}
				class="w-full text-left flex items-center justify-between text-xl font-semibold text-gray-900 mb-4 hover:text-gray-700 transition-colors"
				aria-expanded={!doorsCollapsed}
				aria-controls="doors-content"
			>
				<div class="flex items-center">
					Doors
					<span class="ml-2 text-sm text-gray-500">({data.groupedResources.doors.length})</span>
				</div>
				<svg 
					class="w-5 h-5 transform transition-transform {doorsCollapsed ? '-rotate-90' : 'rotate-0'}" 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
				</svg>
			</button>
			
			{#if !doorsCollapsed}
				<div id="doors-content">
					{#if data.groupedResources.doors.length === 0}
					<div class="text-center py-8 text-gray-500">
						<p>No doors configured yet.</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each data.groupedResources.doors as resource}
							<div class="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1">
										<h3 class="font-medium text-gray-900">{resource.name}</h3>
										<p class="text-sm text-gray-500">ID: {resource.resource_id}</p>
									</div>
									<div class="flex items-center space-x-2">
										<span class="{getConnectionStatusColor(resource.connection_status)} text-lg" title="Connection Status">
											{getConnectionStatusIcon(resource.connection_status)}
										</span>
										<Toggle
											enabled={resource.enabled}
											onClick={() => toggleResourceStatus(resource.id, resource.enabled)}
										/>
									</div>
								</div>
								
								{#if resource.lastUser}
									<div class="text-sm text-gray-600 mb-3">
										<div class="flex justify-between">
											<span>Last Access:</span>
											<span class="text-gray-900">{resource.lastUser}</span>
										</div>
										<div class="text-xs text-gray-500 mt-1">
											{new Date(resource.lastAccess).toLocaleString()}
										</div>
									</div>
								{:else}
									<div class="text-sm text-gray-500 mb-3">No recent access</div>
								{/if}
								
								<div class="mt-4 flex space-x-2">
									<Button variant="secondary" on:click={() => openEditModal(resource)} class="flex-1">
										Edit
									</Button>
									<a
										href="/resources/{resource.resource_id}"
										class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium text-center"
									>
										Details
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
				</div>
			{/if}
		</div>

		<!-- Machines Section -->
		<div>
			<button
				on:click={toggleMachinesSection}
				class="w-full text-left flex items-center justify-between text-xl font-semibold text-gray-900 mb-4 hover:text-gray-700 transition-colors"
				aria-expanded={!machinesCollapsed}
				aria-controls="machines-content"
			>
				<div class="flex items-center">
					Machines
					<span class="ml-2 text-sm text-gray-500">({Object.values(data.groupedResources.machines).flat().length})</span>
				</div>
				<svg 
					class="w-5 h-5 transform transition-transform {machinesCollapsed ? '-rotate-90' : 'rotate-0'}" 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
				</svg>
			</button>
			
			{#if !machinesCollapsed}
				<div id="machines-content">
					{#if Object.keys(data.groupedResources.machines).length === 0}
						<div class="text-center py-8 text-gray-500">
							<p>No machines configured yet.</p>
						</div>
					{:else}
					{#each Object.entries(data.groupedResources.machines) as [category, machines]}
						<div class="mb-6">
							<button
								on:click={() => toggleMachineCategory(category)}
								class="w-full text-left flex items-center justify-between text-lg font-medium text-gray-800 mb-3 hover:text-gray-600 transition-colors"
								aria-expanded={!machineCategoryCollapsed[category]}
								aria-controls="category-{category.toLowerCase().replace(/\s+/g, '-')}-content"
							>
								<div class="flex items-center capitalize">
									{category}
									<span class="ml-2 text-sm text-gray-500">({machines.length})</span>
								</div>
								<svg 
									class="w-4 h-4 transform transition-transform {machineCategoryCollapsed[category] ? '-rotate-90' : 'rotate-0'}" 
									fill="none" 
									stroke="currentColor" 
									viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
								</svg>
							</button>
							
							{#if !machineCategoryCollapsed[category]}
								<div id="category-{category.toLowerCase().replace(/\s+/g, '-')}-content" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each machines as resource}
										<div class="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow">
											<div class="flex items-start justify-between mb-3">
												<div class="flex-1">
													<h4 class="font-medium text-gray-900">{resource.name}</h4>
													<p class="text-sm text-gray-500">ID: {resource.resource_id}</p>
												</div>
												<div class="flex items-center space-x-2">
													<span class="{getConnectionStatusColor(resource.connection_status)} text-lg" title="Connection Status">
														{getConnectionStatusIcon(resource.connection_status)}
													</span>
													<Toggle
														enabled={resource.enabled}
														onClick={() => toggleResourceStatus(resource.id, resource.enabled)}
													/>
												</div>
											</div>
											
											{#if resource.isActive}
												<div class="text-sm mb-3">
													<div class="flex justify-between items-center">
														<span class="text-gray-600">Active User:</span>
														<span class="text-green-700 font-medium">{resource.activeUser}</span>
													</div>
													<div class="flex items-center mt-1">
														<div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
														<span class="text-xs text-green-600">In Use</span>
													</div>
												</div>
											{:else}
												<div class="text-sm mb-3">
													<div class="flex justify-between items-center">
														<span class="text-gray-600">Active User:</span>
														<span class="text-gray-500">None</span>
													</div>
													<div class="flex items-center mt-1">
														<div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
														<span class="text-xs text-gray-500">Available</span>
													</div>
												</div>
											{/if}
											
											<div class="flex space-x-2">
												<Button variant="secondary" on:click={() => openEditModal(resource)} class="flex-1">
													Edit
												</Button>
												<a
													href="/resources/{resource.resource_id}"
													class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium text-center"
												>
													Details
												</a>
											</div>
											
											{#if resource.require_card_present}
												<div class="mt-2 text-xs text-gray-500 italic">
													This machine requires the RFID card to remain present
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Add Resource Modal -->
<Modal isOpen={showAddModal} title="Add New Resource" on:close={closeModals}>
	<form id="add-resource-form" method="POST" action="?/create" use:enhance on:submit={closeModals}>
		<div class="space-y-4">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={newResource.name}
					required
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
				/>
			</div>
			
			<div>
				<label for="type" class="block text-sm font-medium text-gray-700">Type</label>
				<select
					id="type"
					name="type"
					bind:value={newResource.type}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
				>
					<option value="door">Door</option>
					<option value="machine">Machine</option>
				</select>
			</div>
			
			{#if newResource.type === 'machine'}
				<div>
					<label for="category" class="block text-sm font-medium text-gray-700">Category</label>
					<select
						id="category"
						name="category"
						bind:value={newResource.category}
						class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
					>
						<option value="">Select category...</option>
						{#each machineCategories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>
				
				<div class="flex items-center">
					<input
						type="checkbox"
						id="require_card_present"
						name="require_card_present"
						bind:checked={newResource.require_card_present}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<label for="require_card_present" class="ml-2 block text-sm text-gray-900">
						Require card present during use
					</label>
				</div>
			{/if}
		</div>
	</form>
	
	<div slot="footer" class="flex flex-col sm:flex-row gap-3 sm:justify-end">
		<Button variant="secondary" on:click={closeModals} fullWidth class="sm:w-auto">
			Cancel
		</Button>
		<Button variant="primary" type="submit" form="add-resource-form" fullWidth class="sm:w-auto">
			Add Resource
		</Button>
	</div>
</Modal>

<!-- Edit Resource Modal -->
<Modal isOpen={showEditModal && editingResource} title="Edit Resource" on:close={closeModals}>
	{#if editingResource}
		<form id="edit-resource-form" method="POST" action="?/update" use:enhance on:submit={closeModals}>
			<input type="hidden" name="id" value={editingResource.id} />
			
			<div class="space-y-4">
				<div>
					<label for="edit_name" class="block text-sm font-medium text-gray-700">Name</label>
					<input
						type="text"
						id="edit_name"
						name="name"
						bind:value={editingResource.name}
						required
						class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
					/>
				</div>
				
				<div>
					<label for="edit_type" class="block text-sm font-medium text-gray-700">Type</label>
					<select
						id="edit_type"
						name="type"
						bind:value={editingResource.type}
						class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
					>
						<option value="door">Door</option>
						<option value="machine">Machine</option>
					</select>
				</div>
				
				{#if editingResource.type === 'machine'}
					<div>
						<label for="edit_category" class="block text-sm font-medium text-gray-700">Category</label>
						<select
							id="edit_category"
							name="category"
							bind:value={editingResource.category}
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
						>
							<option value="">Select category...</option>
							{#each machineCategories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
					</div>
					
					<div class="flex items-center">
						<input
							type="checkbox"
							id="edit_require_card_present"
							name="require_card_present"
							bind:checked={editingResource.require_card_present}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<label for="edit_require_card_present" class="ml-2 block text-sm text-gray-900">
							Require card present during use
						</label>
					</div>
				{/if}
			</div>
		</form>
	{/if}
	
	<div slot="footer" class="flex flex-col sm:flex-row gap-3 sm:justify-between">
		{#if editingResource}
			<Button variant="danger" on:click={() => {
				if (confirm('Are you sure you want to delete this resource?')) {
					const form = document.createElement('form');
					form.method = 'POST';
					form.action = '?/delete';
					const input = document.createElement('input');
					input.type = 'hidden';
					input.name = 'id';
					input.value = editingResource.id;
					form.appendChild(input);
					document.body.appendChild(form);
					form.submit();
					closeModals();
				}
			}} fullWidth class="sm:w-auto order-3 sm:order-1">
				Delete
			</Button>
			<div class="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
				<Button variant="secondary" on:click={closeModals} fullWidth class="sm:w-auto">
					Cancel
				</Button>
				<Button variant="primary" type="submit" form="edit-resource-form" fullWidth class="sm:w-auto">
					Update Resource
				</Button>
			</div>
		{/if}
	</div>
</Modal>

<style>
</style>
