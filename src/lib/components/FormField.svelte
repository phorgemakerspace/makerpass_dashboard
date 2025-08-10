<script>
	export let label = '';
	export let name = '';
	export let type = 'text';
	export let value = '';
	export let placeholder = '';
	export let required = false;
	export let disabled = false;
	export let error = '';
	export let help = '';
	export let options = []; // For select fields
	export let rows = 3; // For textarea
	
	$: isSelect = type === 'select';
	$: isTextarea = type === 'textarea';
	$: isCheckbox = type === 'checkbox';
	$: hasError = !!error;
	
	$: inputClasses = `block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 text-sm ${
		hasError 
			? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
			: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
	} ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`;
</script>

<div class="space-y-1">
	{#if label && !isCheckbox}
		<label for={name} class="block text-sm font-medium text-gray-700 {required ? 'required' : ''}">
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</label>
	{/if}
	
	{#if isSelect}
		<select
			{name}
			id={name}
			bind:value
			{required}
			{disabled}
			class={inputClasses}
		>
			<option value="">{placeholder || 'Select an option'}</option>
			{#each options as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	{:else if isTextarea}
		<textarea
			{name}
			id={name}
			bind:value
			{placeholder}
			{required}
			{disabled}
			{rows}
			class={inputClasses}
		></textarea>
	{:else if isCheckbox}
		<div class="flex items-center">
			<input
				type="checkbox"
				{name}
				id={name}
				bind:checked={value}
				{required}
				{disabled}
				class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
			/>
			{#if label}
				<label for={name} class="ml-2 block text-sm text-gray-900">
					{label}
					{#if required}<span class="text-red-500 ml-1">*</span>{/if}
				</label>
			{/if}
		</div>
	{:else}
		<input
			type={type}
			{name}
			id={name}
			bind:value
			{placeholder}
			{required}
			{disabled}
			class={inputClasses}
		/>
	{/if}
	
	{#if help}
		<p class="text-sm text-gray-500">{help}</p>
	{/if}
	
	{#if hasError}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>

<style>
	.required::after {
		content: " *";
		color: #ef4444;
	}
</style>
