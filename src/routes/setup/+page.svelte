<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	
	export let form;

	let username = '';
	let password = '';
	let confirmPassword = '';
	let showPassword = false;
	let showConfirmPassword = false;

	$: passwordsMatch = password === confirmPassword;
	$: isValid = username.length >= 3 && password.length >= 8 && passwordsMatch;

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function toggleConfirmPasswordVisibility() {
		showConfirmPassword = !showConfirmPassword;
	}
</script>

<svelte:head>
	<title>Setup - MakerPass Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<!-- Logo -->
		<div class="flex justify-center mb-6">
			<svg 
				width="200" height="40" viewBox="0 0 250 48" 
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-auto"
			>
				<!-- Orange rounded rectangle background -->
				<rect x="4" y="4" width="64" height="40" rx="8" ry="8" fill="#d25a2c"/>
				
				<!-- White person icon - circle head -->
				<circle cx="24" cy="18" r="5" fill="white"/>
				
				<!-- White person icon - body -->
				<path d="M16 30 C16 27, 19.5 25, 24 25 C28.5 25, 32 27, 32 30 L32 36 C32 37, 31 38, 30 38 L18 38 C17 38, 16 37, 16 36 Z" fill="white"/>
				
				<!-- White horizontal lines for text -->
				<rect x="38" y="16" width="22" height="3" rx="1.5" fill="white"/>
				<rect x="38" y="22" width="22" height="3" rx="1.5" fill="white"/>
				<rect x="38" y="28" width="16" height="3" rx="1.5" fill="white"/>
				
				<!-- MakerPass text -->
				<text x="76" y="36" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#2d2d2d">MakerPass</text>
			</svg>
		</div>
		
		<h2 class="text-center text-3xl font-extrabold text-gray-900">
			Welcome to MakerPass
		</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Set up your administrator account to get started
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{#if form?.error}
				<div class="mb-4 rounded-md bg-red-50 p-4">
					<div class="text-sm text-red-700">
						{form.error}
					</div>
				</div>
			{/if}

			<form method="POST" use:enhance class="space-y-6">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700">
						Username
					</label>
					<div class="mt-1">
						<input
							id="username"
							name="username"
							type="text"
							bind:value={username}
							required
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
							placeholder="Enter your username"
						/>
					</div>
					{#if username.length > 0 && username.length < 3}
						<p class="mt-1 text-sm text-red-600">Username must be at least 3 characters</p>
					{/if}
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="mt-1 relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							required
							class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
							placeholder="Enter your password"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
							on:click={togglePasswordVisibility}
						>
							<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if showPassword}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
								{:else}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								{/if}
							</svg>
						</button>
					</div>
					{#if password.length > 0 && password.length < 8}
						<p class="mt-1 text-sm text-red-600">Password must be at least 8 characters</p>
					{/if}
				</div>

				<div>
					<label for="confirm_password" class="block text-sm font-medium text-gray-700">
						Confirm Password
					</label>
					<div class="mt-1 relative">
						<input
							id="confirm_password"
							name="confirm_password"
							type={showConfirmPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							required
							class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
							placeholder="Confirm your password"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
							on:click={toggleConfirmPasswordVisibility}
						>
							<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if showConfirmPassword}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
								{:else}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								{/if}
							</svg>
						</button>
					</div>
					{#if confirmPassword.length > 0 && !passwordsMatch}
						<p class="mt-1 text-sm text-red-600">Passwords do not match</p>
					{/if}
				</div>

				<div>
					<button
						type="submit"
						disabled={!isValid}
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Create Administrator Account
					</button>
				</div>
			</form>

			<div class="mt-6">
				<div class="text-xs text-gray-500 text-center">
					<p class="mb-2">After setup, you'll receive an API key for RFID controller integration.</p>
					<p>Make sure to save your credentials securely.</p>
				</div>
			</div>
		</div>
	</div>
</div>
