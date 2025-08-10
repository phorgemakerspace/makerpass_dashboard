<script>
	export let items = [];
	// items should be an array of { href: string, label: string } objects
	// The last item will be shown as current (no link)
</script>

<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-4">
	{#each items as item, index}
		{#if index < items.length - 1}
			<a href={item.href} class="hover:text-gray-700">{item.label}</a>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
			</svg>
		{:else}
			<span class="text-gray-900">{item.label}</span>
		{/if}
	{/each}
</nav>
