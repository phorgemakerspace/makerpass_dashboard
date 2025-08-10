<script>
	export let enabled = false;
	export let onClick = () => {};
	export let ariaLabel = 'Toggle';
	export let title = 'Enable/Disable';
</script>

<button
	on:click={onClick}
	class="toggle-switch {enabled ? 'bg-green-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
	{title}
	aria-label={ariaLabel}
>
	<span class="sr-only">Toggle status</span>
	<span class="{enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
</button>

<style>
	.toggle-switch:focus {
		outline: 2px solid transparent;
		outline-offset: 2px;
	}
</style>
