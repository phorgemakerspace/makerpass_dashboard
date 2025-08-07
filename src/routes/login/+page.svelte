<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let form;
	
	$: setupSuccess = $page.url.searchParams.get('setup') === 'success';
</script>

<svelte:head>
	<title>Login - MakerPass Dashboard</title>
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
			Welcome back
		</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Sign in to your administrator account
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{#if setupSuccess}
				<div class="mb-6 rounded-md bg-green-50 p-4">
					<div class="text-sm text-green-700">
						Administrator account created successfully! Please sign in with your new credentials.
					</div>
				</div>
			{/if}

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
							required
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
							placeholder="Enter your username"
						/>
					</div>
				</div>
				
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="mt-1">
						<input
							id="password"
							name="password"
							type="password"
							required
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
							placeholder="Enter your password"
						/>
					</div>
				</div>

				<div>
					<button
						type="submit"
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
					>
						Sign In
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
