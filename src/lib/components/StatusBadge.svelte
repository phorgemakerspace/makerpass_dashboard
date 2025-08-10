<script>
	export let success = true;
	export let text = '';
	export let variant = 'default'; // 'default', 'small', 'large'
	
	// Auto-generate text if not provided
	$: displayText = text || (success ? 'Success' : 'Failed');
	
	// Dynamic classes based on success state and variant
	$: baseClasses = 'inline-flex items-center rounded-full font-medium';
	$: sizeClasses = {
		small: 'px-2 py-0.5 text-xs',
		default: 'px-2.5 py-0.5 text-xs',
		large: 'px-3 py-1 text-sm'
	}[variant];
	$: colorClasses = success 
		? 'bg-green-100 text-green-800' 
		: 'bg-red-100 text-red-800';
	$: classes = `${baseClasses} ${sizeClasses} ${colorClasses}`;
</script>

<span class={classes}>
	{displayText}
</span>
