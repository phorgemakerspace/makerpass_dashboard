<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let form;
	
	$: setupSuccess = $page.url.searchParams.get('setup') === 'success';
</script>

<svelte:head>
	<title>Login - MakerPass Dashboard</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				MakerPass Dashboard
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Sign in to your admin account
			</p>
		</div>
		
		{#if setupSuccess}
			<div class="rounded-md bg-green-50 p-4">
				<div class="text-sm text-green-700">
					Administrator account created successfully! Please sign in with your new credentials.
				</div>
			</div>
		{/if}
		
		<form method="POST" use:enhance class="mt-8 space-y-6">
			<div class="rounded-md shadow-sm -space-y-px">
				<div>
					<label for="username" class="sr-only">Username</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Username"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			{#if form?.error}
				<div class="rounded-md bg-red-50 p-4">
					<div class="text-sm text-red-700">
						{form.error}
					</div>
				</div>
			{/if}

			<div>
				<button
					type="submit"
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Sign in
				</button>
			</div>
		</form>
		
		<div class="text-center text-sm text-gray-600">
			<p>Default credentials:</p>
			<p>Username: <span class="font-mono">admin</span></p>
			<p>Password: <span class="font-mono">admin123</span></p>
		</div>
	</div>
</div>
