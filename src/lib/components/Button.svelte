<script>
	export let variant = 'primary'; // 'primary', 'secondary', 'danger', 'ghost'
	export let size = 'default'; // 'small', 'default', 'large'
	export let disabled = false;
	export let type = 'button';
	export let fullWidth = false;
	
	let className = '';
	export { className as class };
	
	$: baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
	
	$: sizeClasses = {
		small: 'px-3 py-1.5 text-sm',
		default: 'px-4 py-2 text-sm',
		large: 'px-6 py-3 text-base'
	}[size];
	
	$: variantClasses = {
		primary: 'btn-primary text-white shadow-sm focus-ring-primary',
		secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
		ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:ring-blue-500'
	}[variant];
	
	$: widthClasses = fullWidth ? 'w-full' : '';
	$: disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
	
	$: classes = `${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${disabledClasses} ${className}`.trim();
</script>

<button 
	{type} 
	{disabled}
	class={classes}
	on:click
	on:submit
	{...$$restProps}
>
	<slot />
</button>
