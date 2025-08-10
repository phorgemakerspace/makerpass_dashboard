<script>
	export let data = [];
	export let columns = []; // Array of { key, label, sortable?, width?, align? }
	export let loading = false;
	export let emptyMessage = 'No data available';
	export let sortBy = '';
	export let sortDirection = 'asc';
	export let rowClickable = false;
	
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	
	function handleSort(column) {
		if (!column.sortable) return;
		
		if (sortBy === column.key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column.key;
			sortDirection = 'asc';
		}
		
		dispatch('sort', { column: column.key, direction: sortDirection });
	}
	
	function handleRowClick(row, index) {
		if (rowClickable) {
			dispatch('rowClick', { row, index });
		}
	}
	
	function getSortIcon(column) {
		if (!column.sortable) return '';
		if (sortBy !== column.key) return '↕️';
		return sortDirection === 'asc' ? '↑' : '↓';
	}
	
	function getAlignmentClass(align) {
		switch (align) {
			case 'center': return 'text-center';
			case 'right': return 'text-right';
			default: return 'text-left';
		}
	}
</script>

<div class="bg-white shadow overflow-hidden sm:rounded-md">
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-500">Loading...</span>
		</div>
	{:else if data.length === 0}
		<div class="text-center py-12 text-gray-500">
			{emptyMessage}
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						{#each columns as column}
							<th 
								scope="col" 
								class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider {getAlignmentClass(column.align)} {column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}"
								class:select-none={column.sortable}
								style={column.width ? `width: ${column.width}` : ''}
								on:click={() => handleSort(column)}
							>
								<div class="flex items-center {getAlignmentClass(column.align)}">
									{column.label}
									{#if column.sortable}
										<span class="ml-1 text-gray-400">{getSortIcon(column)}</span>
									{/if}
								</div>
							</th>
						{/each}
						{#if $$slots.actions}
							<th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						{/if}
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each data as row, index}
						<tr 
							class="hover:bg-gray-50 {rowClickable ? 'cursor-pointer' : ''}"
							on:click={() => handleRowClick(row, index)}
						>
							{#each columns as column}
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 {getAlignmentClass(column.align)}">
									<slot name="cell" {column} {row} {index}>
										{row[column.key] ?? '—'}
									</slot>
								</td>
							{/each}
							{#if $$slots.actions}
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<slot name="actions" {row} {index} />
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
