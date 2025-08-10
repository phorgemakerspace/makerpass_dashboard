<script>
	import { createEventDispatcher } from 'svelte';
	
	export let tabs = []; // Array of { id, label, icon? }
	export let activeTab = '';
	export let orientation = 'horizontal'; // 'horizontal' | 'vertical'
	export let variant = 'default'; // 'default' | 'pills' | 'underline'
	
	const dispatch = createEventDispatcher();
	
	function handleTabClick(tabId) {
		activeTab = tabId;
		dispatch('change', { activeTab: tabId });
	}
	
	$: isVertical = orientation === 'vertical';
	$: containerClasses = isVertical 
		? 'space-y-1' 
		: 'flex overflow-x-auto border-b border-gray-200';
		
	function getTabClasses(tab, isActive) {
		const base = isVertical 
			? 'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors'
			: 'flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors';
			
		if (variant === 'pills' && isVertical) {
			return `${base} ${isActive 
				? 'bg-blue-100 text-primary' 
				: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`;
		} else if (variant === 'underline' && !isVertical) {
			return `${base} border-b-2 ${isActive 
				? 'border-primary text-primary' 
				: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;
		} else {
			return `${base} ${isActive 
				? 'bg-blue-50 text-primary' 
				: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`;
		}
	}
</script>

<nav class={containerClasses} aria-label="Tabs">
	{#each tabs as tab}
		<button
			type="button"
			class={getTabClasses(tab, activeTab === tab.id)}
			on:click={() => handleTabClick(tab.id)}
			aria-current={activeTab === tab.id ? 'page' : undefined}
		>
			{#if tab.icon}
				{@html tab.icon}
			{/if}
			{tab.label}
		</button>
	{/each}
</nav>
