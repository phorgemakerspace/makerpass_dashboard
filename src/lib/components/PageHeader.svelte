<script>
	export let title = '';
	export let description = '';
	export let showSearch = false;
	export let searchPlaceholder = 'Search...';
	export let searchValue = '';
	
	function handleSearchInput(event) {
		searchValue = event.target.value;
	}
</script>

<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
	<div>
		<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
		{#if description}
			<p class="text-gray-600 mt-2 text-sm sm:text-base">{description}</p>
		{/if}
	</div>
	
	<div class="flex flex-col sm:flex-row gap-4 sm:items-center">
		{#if showSearch}
			<div class="relative">
				<input
					type="text"
					placeholder={searchPlaceholder}
					bind:value={searchValue}
					on:input={handleSearchInput}
					class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
				/>
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
			</div>
		{/if}
		
		<!-- Action buttons slot -->
		<slot name="actions" />
	</div>
</div>
