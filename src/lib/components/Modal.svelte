<script>
	import { createEventDispatcher } from 'svelte';
	
	export let show = false;
	export let isOpen = false; // Alternative prop name for consistency
	export let title = '';
	export let size = 'default'; // 'small', 'default', 'large', 'xl'
	
	const dispatch = createEventDispatcher();
	
	// Support both show and isOpen props
	$: isVisible = show || isOpen;
	
	function handleClose() {
		dispatch('close');
	}
	
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
	
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
	
	$: sizeClasses = {
		small: 'max-w-sm',
		default: 'max-w-md',
		large: 'max-w-lg',
		xl: 'max-w-2xl'
	}[size];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-tabindex -->
	<div 
		class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start sm:items-center justify-center p-4 pt-8 sm:pt-4"
		on:click={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		aria-labelledby={title ? 'modal-title' : undefined}
	>
		<div class="bg-white rounded-lg shadow-xl {sizeClasses} w-full mx-4">
			<!-- Header -->
			{#if title || $$slots.header}
				<div class="px-4 sm:px-6 py-4 border-b border-gray-200">
					<div class="flex items-center justify-between">
						{#if $$slots.header}
							<slot name="header" />
						{:else}
							<h3 id="modal-title" class="text-lg font-medium text-gray-900">
								{title}
							</h3>
						{/if}
						<button
							type="button"
							class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
							on:click={handleClose}
							aria-label="Close modal"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{/if}
			
			<!-- Body -->
			<div class="px-4 sm:px-6 py-4">
				<slot />
			</div>
			
			<!-- Footer -->
			{#if $$slots.footer}
				<div class="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}
