<script>
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import TabNavigation from '$lib/components/TabNavigation.svelte';
	
	export let data;
	export let form;

	let primaryColor = data.primaryColor;
	let navigationColor = data.navigationColor;
	let linkColor = data.linkColor;
	let logoColor = data.logoColor;
	let logoFontColor = data.logoFontColor;

	// Sync with server data when it changes (after form submissions)
	$: {
		primaryColor = data.primaryColor;
		navigationColor = data.navigationColor;
		linkColor = data.linkColor;
		logoColor = data.logoColor;
		logoFontColor = data.logoFontColor;
	}

	function copyApiKey() {
		navigator.clipboard.writeText(data.apiKey).then(() => {
			alert('API key copied to clipboard!');
		}).catch(err => {
			console.error('Failed to copy API key:', err);
			alert('Failed to copy API key');
		});
	}

	function regenerateApiKey() {
		if (confirm('Are you sure you want to regenerate the API key? This will invalidate the current key and require updating all RFID controllers.')) {
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/regenerateApiKey';
			
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'admin_id';
			input.value = data.adminId;
			
			form.appendChild(input);
			document.body.appendChild(form);
			form.submit();
		}
	}

	// Apply color themes dynamically
	function applyColorThemes() {
		if (browser && primaryColor && navigationColor && linkColor && logoColor && logoFontColor) {
			document.documentElement.style.setProperty('--primary-color', primaryColor);
			document.documentElement.style.setProperty('--navigation-color', navigationColor);
			document.documentElement.style.setProperty('--link-color', linkColor);
			document.documentElement.style.setProperty('--logo-color', logoColor);
			document.documentElement.style.setProperty('--logo-font-color', logoFontColor);
		}
	}

	// Apply colors when component mounts and when colors change
	$: if (browser && primaryColor && navigationColor && linkColor && logoColor && logoFontColor) {
		applyColorThemes();
	}

	// Handle color input for live preview
	function handlePrimaryColorInput(event) {
		primaryColor = event.target.value;
		if (primaryColor) {
			applyColorThemes();
		}
	}

	function handleNavigationColorInput(event) {
		navigationColor = event.target.value;
		if (navigationColor) {
			applyColorThemes();
		}
	}

	function handleLinkColorInput(event) {
		linkColor = event.target.value;
		if (linkColor) {
			applyColorThemes();
		}
	}

	function handleLogoColorInput(event) {
		logoColor = event.target.value;
		if (logoColor) {
			applyColorThemes();
		}
	}

	function handleLogoFontColorInput(event) {
		logoFontColor = event.target.value;
		if (logoFontColor) {
			applyColorThemes();
		}
	}

	// Tab management
	let activeTab = 'api';
	
	$: tabs = [
		{ 
			id: 'api', 
			label: 'API',
			icon: '<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
		},
		{ 
			id: 'theme', 
			label: 'Theme',
			icon: '<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>'
		},
		{ 
			id: 'data', 
			label: 'Data',
			icon: '<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>'
		},
		{ 
			id: 'maintenance', 
			label: 'Maintenance',
			icon: '<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>'
		},
		{ 
			id: 'reset', 
			label: 'Reset',
			icon: '<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>'
		},
		{ 
			id: 'email', 
			label: 'Email',
			icon: '<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>'
		},
		{ 
			id: 'stripe', 
			label: 'Stripe',
			icon: '<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>'
		}
	];
	
	function handleTabChange(event) {
		activeTab = event.detail.activeTab;
	}

	// Maintenance threshold slider
	let maintenanceThreshold = data.maintenanceThreshold || 75;
	let timezone = data.timezone || 'America/New_York';
	
	// Sync with server data when it changes (after form submissions)
	$: {
		if (data.maintenanceThreshold !== undefined) {
			maintenanceThreshold = data.maintenanceThreshold;
		}
		if (data.timezone !== undefined) {
			timezone = data.timezone;
		}
	}
</script>

<svelte:head>
	<title>Settings - MakerPass Dashboard</title>
	<style>
		:root {
			--primary-color: {data.primaryColor};
		}
	</style>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="border-4 border-dashed border-gray-200 rounded-lg p-4 sm:p-8">
		<div class="mb-6 sm:mb-8">
			<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
			<p class="text-gray-600 mt-2 text-sm sm:text-base">Configure your MakerPass dashboard settings</p>
		</div>

		{#if form?.error}
			<div class="mb-4 rounded-md bg-red-50 p-4">
				<div class="text-sm text-red-700">
					{form.error}
				</div>
			</div>
		{/if}

		{#if form?.success}
			<div class="mb-4 rounded-md bg-green-50 p-4">
				<div class="text-sm text-green-700">
					{form.message}
				</div>
			</div>
		{/if}

		<!-- Settings Layout with Tabs -->
		<div class="flex flex-col lg:flex-row gap-6">
			<!-- Tab Navigation -->
			<div class="lg:w-64 flex-shrink-0">
				<!-- Mobile horizontal tabs -->
				<div class="lg:hidden mb-4">
					<TabNavigation 
						{tabs} 
						{activeTab} 
						orientation="horizontal"
						variant="underline"
						on:change={handleTabChange}
					/>
				</div>

				<!-- Desktop vertical tabs -->
				<div class="hidden lg:block">
					<TabNavigation 
						{tabs} 
						{activeTab} 
						orientation="vertical"
						variant="pills"
						on:change={handleTabChange}
					/>
				</div>
			</div>

			<!-- Tab Content -->
			<div class="flex-1">
				<!-- API Configuration Section -->
				{#if activeTab === 'api'}
					<div class="bg-white p-4 sm:p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">API Configuration</h2>
						<div class="space-y-4">
							<div>
								<label for="api_key" class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
								<div class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
									<input
										type="text"
										id="api_key"
										value={data.apiKey}
										readonly
										class="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-sm break-all"
									/>
									<div class="flex space-x-2 w-full sm:w-auto">
										<button
											on:click={copyApiKey}
											class="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
										>
											Copy
										</button>
										<button
											on:click={regenerateApiKey}
											class="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
										>
											Regenerate
										</button>
									</div>
								</div>
								<p class="mt-2 text-sm text-gray-500">
									This API key is required for all RFID controller requests. Keep it secure and update your controllers when regenerated.
								</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Theme Configuration Section -->
				{#if activeTab === 'theme'}
					<div class="bg-white p-4 sm:p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">Theme Configuration</h2>
						
						<!-- Button/Primary Color -->
						<form method="POST" action="?/updatePrimaryColor" use:enhance class="mb-4 sm:mb-6">
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div class="space-y-4">
								<div>
									<label for="primary_color" class="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
									<div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
										<div class="flex items-center space-x-2">
											<input
												type="color"
												id="primary_color_picker"
												bind:value={primaryColor}
												on:input={handlePrimaryColorInput}
												class="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
											/>
											<input
												type="text"
												id="primary_color"
												name="primary_color"
												bind:value={primaryColor}
												on:input={handlePrimaryColorInput}
												placeholder="#d25a2c"
												class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 text-sm font-mono w-24"
											/>
										</div>
										<button
											type="submit"
											class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
										>
											Save Color
										</button>
									</div>
									<p class="mt-2 text-sm text-gray-500">
										This color will be used for buttons and form controls throughout the dashboard.
									</p>
								</div>
							</div>
						</form>

						<!-- Navigation Color -->
						<form method="POST" action="?/updateNavigationColor" use:enhance class="mb-4 sm:mb-6">
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div class="space-y-4">
								<div>
									<label for="navigation_color" class="block text-sm font-medium text-gray-700 mb-2">Navigation Background Color</label>
									<div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
										<div class="flex items-center space-x-2">
											<input
												type="color"
												id="navigation_color_picker"
												bind:value={navigationColor}
												on:input={handleNavigationColorInput}
												class="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
											/>
											<input
												type="text"
												id="navigation_color"
												name="navigation_color"
												bind:value={navigationColor}
												on:input={handleNavigationColorInput}
												placeholder="#2d2d2d"
												class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 text-sm font-mono w-24"
											/>
										</div>
										<button
											type="submit"
											class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
										>
											Save Color
										</button>
									</div>
									<p class="mt-2 text-sm text-gray-500">
										This color will be used for the top navigation bar background.
									</p>
								</div>
							</div>
						</form>

						<!-- Link Color -->
						<form method="POST" action="?/updateLinkColor" use:enhance class="mb-4 sm:mb-6">
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div class="space-y-4">
								<div>
									<label for="link_color" class="block text-sm font-medium text-gray-700 mb-2">Link & Active Navigation Color</label>
									<div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
										<div class="flex items-center space-x-2">
											<input
												type="color"
												id="link_color_picker"
												bind:value={linkColor}
												on:input={handleLinkColorInput}
												class="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
											/>
											<input
												type="text"
												id="link_color"
												name="link_color"
												bind:value={linkColor}
												on:input={handleLinkColorInput}
												placeholder="#ffffff"
												class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 text-sm font-mono w-24"
											/>
										</div>
										<button
											type="submit"
											class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
										>
											Save Color
										</button>
									</div>
									<p class="mt-2 text-sm text-gray-500">
										This color will be used for links and active navigation items.
									</p>
								</div>
							</div>
						</form>

						<!-- Logo Color -->
						<form method="POST" action="?/updateLogoColor" use:enhance class="mb-4 sm:mb-6">
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div class="space-y-4">
								<div>
									<label for="logo_color" class="block text-sm font-medium text-gray-700 mb-2">Logo Card Color</label>
									<div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
										<div class="flex items-center space-x-2">
											<input
												type="color"
												id="logo_color_picker"
												bind:value={logoColor}
												on:input={handleLogoColorInput}
												class="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
											/>
											<input
												type="text"
												id="logo_color"
												name="logo_color"
												bind:value={logoColor}
												on:input={handleLogoColorInput}
												placeholder="#d25a2c"
												class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 text-sm font-mono w-24"
											/>
										</div>
										<button
											type="submit"
											class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
										>
											Save Color
										</button>
									</div>
									<p class="mt-2 text-sm text-gray-500">
										This color will be used for the ID card background in the MakerPass logo.
									</p>
								</div>
							</div>
						</form>
						
						<!-- Logo Font Color -->
						<form method="POST" action="?/updateLogoFontColor" use:enhance class="mb-4 sm:mb-6">
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div class="space-y-4">
								<div>
									<label for="logo_font_color" class="block text-sm font-medium text-gray-700 mb-2">Logo Font Color</label>
									<div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
										<div class="flex items-center space-x-2">
											<input
												type="color"
												id="logo_font_color_picker"
												bind:value={logoFontColor}
												on:input={handleLogoFontColorInput}
												class="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
											/>
											<input
												type="text"
												id="logo_font_color"
												name="logo_font_color"
												bind:value={logoFontColor}
												on:input={handleLogoFontColorInput}
												placeholder="#ffffff"
												class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 text-sm font-mono w-24"
											/>
										</div>
										<button
											type="submit"
											class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
										>
											Save Color
										</button>
									</div>
									<p class="mt-2 text-sm text-gray-500">
										This color will be used for the "MakerPass" text in the logo.
									</p>
								</div>
							</div>
						</form>
								
						<!-- Color Preview -->
						<div class="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
							<h3 class="text-sm font-medium text-gray-700 mb-3">Live Preview</h3>
							<div class="space-y-4">
								<!-- Navigation Preview -->
								<div class="p-3 rounded-md border-2 border-dashed border-gray-300 overflow-hidden" style="background-color: var(--navigation-color);">
									<div class="text-sm font-medium text-gray-700 mb-2">Navigation Bar</div>
									<div class="flex flex-wrap gap-2 sm:gap-4">
										<span class="text-link text-sm">Dashboard</span>
										<span class="text-sm text-gray-500">Resources</span>
										<span class="text-sm text-gray-500">Users</span>
									</div>
								</div>
								
								<!-- Button Preview -->
								<div class="space-y-2">
									<div class="text-sm font-medium text-gray-700">Buttons</div>
									<button
										type="button"
										class="btn-primary px-3 py-2 text-sm font-medium text-white rounded-md"
									>
										Primary Button
									</button>
								</div>
								
								<!-- Links Preview -->
								<div class="space-y-2">
									<div class="text-sm font-medium text-gray-700">Links & Active Items</div>
									<div>
										<span class="text-link text-sm font-medium hover:opacity-80 cursor-pointer">
											Link Example
										</span>
									</div>
								</div>
								
								<!-- Logo Preview -->
								<div class="space-y-2">
									<div class="text-sm font-medium text-gray-700">Logo</div>
									<div class="overflow-x-auto">
										<svg width="120" height="24" viewBox="0 0 250 48" xmlns="http://www.w3.org/2000/svg" class="border border-gray-200 rounded min-w-full sm:min-w-0">
											<rect x="2" y="2" width="32" height="20" rx="4" ry="4" fill="var(--logo-color)"/>
											<circle cx="12" cy="9" r="2.5" fill="white"/>
											<path d="M8 15 C8 13.5, 9.75 12.5, 12 12.5 C14.25 12.5, 16 13.5, 16 15 L16 18 C16 18.5, 15.5 19, 15 19 L9 19 C8.5 19, 8 18.5, 8 18 Z" fill="white"/>
											<rect x="19" y="8" width="11" height="1.5" rx="0.75" fill="white"/>
											<rect x="19" y="11" width="11" height="1.5" rx="0.75" fill="white"/>
											<rect x="19" y="14" width="8" height="1.5" rx="0.75" fill="white"/>
											<text x="38" y="18" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="var(--logo-font-color)">MakerPass</text>
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Data Retention Section -->
				{#if activeTab === 'data'}
					<div class="bg-white p-4 sm:p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">Data Retention</h2>
						<p class="text-sm text-gray-600 mb-4">Configure how long to keep historical data before automatic cleanup.</p>
						<form method="POST" action="?/updateRetentionSettings" use:enhance class="space-y-4">
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div>
									<label for="access_log_retention_days" class="block text-sm font-medium text-gray-700 mb-2">
										Access Log Retention (Days)
									</label>
									<input
										type="number"
										id="access_log_retention_days"
										name="access_log_retention_days"
										value={data.accessLogRetentionDays}
										min="1"
										max="3650"
										required
										class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
									<p class="text-xs text-gray-500 mt-1">Default: 90 days. Access logs older than this will be automatically deleted.</p>
							</div>
							<div>
								<label for="maintenance_log_retention_days" class="block text-sm font-medium text-gray-700 mb-2">
									Maintenance Log Retention (Days)
								</label>
								<input
									type="number"
									id="maintenance_log_retention_days"
									name="maintenance_log_retention_days"
									value={data.maintenanceLogRetentionDays}
									min="1"
									max="3650"
									required
									class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
								<p class="text-xs text-gray-500 mt-1">Default: 180 days. Maintenance events older than this will be automatically deleted.</p>
							</div>

							<div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
								<button
									type="submit"
									class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
										Update Retention Settings
								</button>
							</div>
						</form>
					</div>

					<!-- Manual Cleanup Section -->
					<div class="mt-6 pt-6 border-t border-gray-200">
						<h3 class="text-md font-medium text-gray-900 mb-2">Manual Cleanup</h3>
						<p class="text-sm text-gray-600 mb-4">
							Clean up old data immediately based on current retention settings. 
							This will delete access logs older than {data.accessLogRetentionDays} days and maintenance events older than {data.maintenanceLogRetentionDays} days.
						</p>
				
						<!-- Data Statistics -->
						<div class="bg-gray-50 rounded-lg p-4 mb-4">
							<h4 class="text-sm font-medium text-gray-900 mb-3">Current Data Usage</h4>
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
								<div class="text-center">
									<div class="text-lg font-bold text-blue-600">{data.dataStatistics.accessLogs.total.toLocaleString()}</div>
									<div class="text-gray-500">Total Access Logs</div>
								</div>
							<div class="text-center">
								<div class="text-lg font-bold text-green-600">{data.dataStatistics.maintenanceEvents.total.toLocaleString()}</div>
								<div class="text-gray-500">Total Maintenance Events</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-bold text-purple-600">{data.dataStatistics.totalRecords.toLocaleString()}</div>
								<div class="text-gray-500">Total Records</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-bold text-gray-600">{(data.dataStatistics.databaseSize / 1024 / 1024).toFixed(1)} MB</div>
								<div class="text-gray-500">Database Size</div>
							</div>
						</div>
					
						{#if data.dataStatistics.accessLogs.oldest || data.dataStatistics.maintenanceEvents.oldest}
							<div class="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
								{#if data.dataStatistics.accessLogs.oldest}
									<div>Oldest access log: {new Date(data.dataStatistics.accessLogs.oldest).toLocaleDateString()}</div>
								{/if}
								{#if data.dataStatistics.maintenanceEvents.oldest}
									<div>Oldest maintenance event: {new Date(data.dataStatistics.maintenanceEvents.oldest).toLocaleDateString()}</div>
								{/if}
							</div>
						{/if}
					</div>
				
					<form method="POST" action="?/cleanupOldData" use:enhance={({ formElement, formData, action, cancel }) => {
						if (!confirm('Are you sure you want to permanently delete old data? This action cannot be undone.')) {
								cancel();
							}
						}}>
						<input type="hidden" name="admin_id" value={data.adminId} />
						<button
						type="submit"
						class="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
					>
						Clean Up Old Data Now
						</button>
					</form>
				
					{#if form?.cleanupResult}
						<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
							<div class="text-sm text-green-800">
								<strong>Cleanup Summary:</strong>
								<br />
								• {form.cleanupResult.accessLogsDeleted} access logs deleted
								<br />
								• {form.cleanupResult.maintenanceEventsDeleted} maintenance events deleted
								<br />
								• Total: {form.cleanupResult.totalDeleted} records removed
							</div>
						</div>
					{/if}
					</div>
				{/if}

				<!-- Maintenance Settings Section -->
				{#if activeTab === 'maintenance'}
					<div class="bg-white p-4 sm:p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">Maintenance Settings</h2>
						<p class="text-sm text-gray-600 mb-4">Configure maintenance task display settings.</p>
						
						<form method="POST" action="?/updateMaintenanceThreshold" use:enhance class="space-y-4">
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div>
								<label for="maintenance_threshold" class="block text-sm font-medium text-gray-700 mb-2">
									Maintenance Completion Threshold
								</label>
								<div class="flex items-center space-x-3">
									<input
										type="range"
										id="maintenance_threshold"
										name="maintenance_threshold"
										min="0"
										max="100"
										step="5"
										bind:value={maintenanceThreshold}
										class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
									/>
									<div class="flex items-center space-x-2">
										<span class="text-sm font-medium text-gray-900 min-w-[3rem] text-right">
											{maintenanceThreshold}%
										</span>
									</div>
								</div>
								<p class="mt-2 text-sm text-gray-500">
									Show maintenance tasks completed by at least this percentage of users. Lower values show more tasks, higher values show fewer tasks that need attention.
								</p>
							</div>
							<div class="flex justify-end">
								<button
									type="submit"
									class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
								>
									Save Threshold
								</button>
							</div>
						</form>
					</div>

					<div class="bg-white p-4 sm:p-6 rounded-lg shadow mt-6">
						<h2 class="text-lg font-medium text-gray-900 mb-4">Timezone Settings</h2>
						<p class="text-sm text-gray-600 mb-4">Configure the timezone for displaying timestamps throughout the application.</p>
						
						<form method="POST" action="?/updateTimezone" use:enhance class="space-y-4">
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div>
								<label for="timezone" class="block text-sm font-medium text-gray-700 mb-2">
									Timezone
								</label>
								<select
									id="timezone"
									name="timezone"
									bind:value={timezone}
									class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
								>
									<option value="America/New_York">Eastern Time (America/New_York)</option>
									<option value="America/Chicago">Central Time (America/Chicago)</option>
									<option value="America/Denver">Mountain Time (America/Denver)</option>
									<option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
									<option value="America/Anchorage">Alaska Time (America/Anchorage)</option>
									<option value="Pacific/Honolulu">Hawaii Time (Pacific/Honolulu)</option>
									<option value="UTC">UTC (Universal Time)</option>
									<option value="Europe/London">London (Europe/London)</option>
									<option value="Europe/Paris">Paris (Europe/Paris)</option>
									<option value="Europe/Berlin">Berlin (Europe/Berlin)</option>
									<option value="Asia/Tokyo">Tokyo (Asia/Tokyo)</option>
									<option value="Australia/Sydney">Sydney (Australia/Sydney)</option>
								</select>
								<p class="mt-2 text-sm text-gray-500">
									All timestamps throughout the application will be displayed in the selected timezone.
								</p>
							</div>
							<div class="flex justify-end">
								<button
									type="submit"
									class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
								>
									Save Timezone
								</button>
							</div>
						</form>
					</div>
				{/if}

				<!-- Reset Settings Section -->
				{#if activeTab === 'reset'}
					<div class="bg-white p-4 sm:p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">Reset Settings</h2>
						<p class="text-sm text-gray-600 mb-6">Reset various settings back to their default values.</p>
						
						<div class="space-y-6">
							<!-- Reset Theme Colors -->
							<div class="border border-gray-200 rounded-lg p-4">
								<h3 class="text-md font-medium text-gray-900 mb-2">Theme Colors</h3>
								<p class="text-sm text-gray-600 mb-4">Reset all theme colors to the default MakerPass color scheme.</p>
								<button
									type="button"
									on:click={() => {
										if (confirm('Reset all colors to default theme?')) {
											const forms = [
												{ action: '?/updatePrimaryColor', name: 'primary_color', value: '#d25a2c' },
												{ action: '?/updateNavigationColor', name: 'navigation_color', value: '#2d2d2d' },
												{ action: '?/updateLinkColor', name: 'link_color', value: '#ffffff' },
												{ action: '?/updateLogoColor', name: 'logo_color', value: '#d25a2c' },
												{ action: '?/updateLogoFontColor', name: 'logo_font_color', value: '#ffffff' }
											];
											
											forms.forEach(formData => {
												const form = document.createElement('form');
												form.method = 'POST';
												form.action = formData.action;
												const colorInput = document.createElement('input');
												colorInput.type = 'hidden';
												colorInput.name = formData.name;
												colorInput.value = formData.value;
												const adminInput = document.createElement('input');
												adminInput.type = 'hidden';
												adminInput.name = 'admin_id';
												adminInput.value = data.adminId;
												form.appendChild(colorInput);
												form.appendChild(adminInput);
												document.body.appendChild(form);
												form.submit();
											});
										}
									}}
									class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
								>
									Reset Theme Colors
								</button>
							</div>

							<!-- Reset Maintenance Settings -->
							<div class="border border-gray-200 rounded-lg p-4">
								<h3 class="text-md font-medium text-gray-900 mb-2">Maintenance Settings</h3>
								<p class="text-sm text-gray-600 mb-4">Reset maintenance threshold to default value (75%).</p>
								<form method="POST" action="?/updateMaintenanceThreshold" use:enhance class="inline">
									<input type="hidden" name="admin_id" value={data.adminId} />
									<input type="hidden" name="maintenance_threshold" value="75" />
									<button
										type="submit"
										on:click={() => confirm('Reset maintenance threshold to 75%?')}
										class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
									>
										Reset Maintenance Threshold
									</button>
								</form>
							</div>
						</div>
					</div>
				{/if}

				<!-- Email Settings Section -->
				{#if activeTab === 'email'}
					<div class="bg-white p-4 sm:p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">Email Settings</h2>
						
						<form method="POST" action="?/updateEmailSettings" use:enhance>
							<input type="hidden" name="admin_id" value={data.adminId} />
							<div class="space-y-4">
								<div>
									<label for="smtp_host" class="block text-sm font-medium text-gray-700">SMTP Host</label>
									<input
										type="text"
										id="smtp_host"
										name="smtp_host"
										value={data.settings?.smtp_host || ''}
										class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
										placeholder="smtp.example.com"
									/>
								</div>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label for="smtp_port" class="block text-sm font-medium text-gray-700">SMTP Port</label>
										<input
											type="number"
											id="smtp_port"
											name="smtp_port"
											value={data.settings?.smtp_port || ''}
											class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
											placeholder="587"
										/>
									</div>
									<div>
										<label for="smtp_security" class="block text-sm font-medium text-gray-700">Security</label>
										<select
											id="smtp_security"
											name="smtp_security"
											class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
										>
											<option value="">None</option>
											<option value="tls" selected={data.settings?.smtp_security === 'tls'}>TLS</option>
											<option value="ssl" selected={data.settings?.smtp_security === 'ssl'}>SSL</option>
										</select>
									</div>
								</div>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label for="smtp_user" class="block text-sm font-medium text-gray-700">SMTP Username</label>
										<input
											type="text"
											id="smtp_user"
											name="smtp_user"
											value={data.settings?.smtp_user || ''}
											class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
											placeholder="user@example.com"
										/>
									</div>
									<div>
										<label for="smtp_pass" class="block text-sm font-medium text-gray-700">SMTP Password</label>
										<input
											type="password"
											id="smtp_pass"
											name="smtp_pass"
											value={data.settings?.smtp_pass || ''}
											class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
											placeholder="••••••••"
										/>
									</div>
								</div>
								<div>
									<label for="from_email" class="block text-sm font-medium text-gray-700">From Email Address</label>
									<input
										type="email"
										id="from_email"
										name="from_email"
										value={data.settings?.from_email || ''}
										class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
										placeholder="noreply@example.com"
									/>
								</div>
							</div>
							<div class="mt-6 flex justify-end">
								<button
									type="submit"
									class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
								>
									Save Email Settings
								</button>
							</div>
						</form>
					</div>
				{/if}

				<!-- Stripe Integration Section -->
				{#if activeTab === 'stripe'}
					<div class="bg-white p-4 sm:p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">Stripe Integration</h2>
						<p class="text-sm text-gray-600 mb-6">
							Configure Stripe webhook integration to automatically manage user subscriptions and access.
							When enabled, Stripe fields will appear in user profiles and new users can be created from subscription webhooks.
						</p>
						
						<form method="POST" action="?/updateStripeSettings" use:enhance>
							<input type="hidden" name="admin_id" value={data.adminId} />
							
							<div class="space-y-6">
								<!-- Enable/Disable Toggle -->
								<div>
									<div class="flex items-center">
										<input
											type="checkbox"
											id="stripe_enabled"
											name="stripe_enabled"
											checked={data.stripe_enabled}
											class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
										/>
										<label for="stripe_enabled" class="ml-2 block text-sm font-medium text-gray-700">
											Enable Stripe Integration
										</label>
									</div>
									<p class="mt-1 text-sm text-gray-500">
										Show Stripe-related fields in user profiles and enable webhook processing
									</p>
								</div>

								<!-- Webhook URL Display -->
								<div>
									<label for="webhook_url" class="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
									<div class="flex items-center space-x-2">
										<input
											type="text"
											id="webhook_url"
											value="{window.location.origin}/webhooks/stripe"
											readonly
											class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm text-gray-600"
										/>
										<button
											type="button"
											on:click={() => navigator.clipboard.writeText(`${window.location.origin}/webhooks/stripe`)}
											class="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
										>
											Copy
										</button>
									</div>
									<p class="mt-1 text-sm text-gray-500">
										Add this URL to your Stripe webhook endpoints. Listen for: customer.*, customer.subscription.*, invoice.payment_succeeded, invoice.payment_failed
									</p>
								</div>

								<!-- Webhook Secret -->
								<div>
									<label for="stripe_webhook_secret" class="block text-sm font-medium text-gray-700 mb-2">
										Webhook Signing Secret
									</label>
									<input
										type="password"
										id="stripe_webhook_secret"
										name="stripe_webhook_secret"
										value={data.stripe_webhook_secret}
										class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
										placeholder="whsec_..."
									/>
									<p class="mt-1 text-sm text-gray-500">
										Get this from your Stripe webhook endpoint settings
									</p>
								</div>

								<!-- API Keys -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="stripe_public_key" class="block text-sm font-medium text-gray-700 mb-2">
											Publishable Key
										</label>
										<input
											type="text"
											id="stripe_public_key"
											name="stripe_public_key"
											value={data.stripe_public_key}
											class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
											placeholder="pk_..."
										/>
									</div>
									<div>
										<label for="stripe_secret_key" class="block text-sm font-medium text-gray-700 mb-2">
											Secret Key
										</label>
										<input
											type="password"
											id="stripe_secret_key"
											name="stripe_secret_key"
											value={data.stripe_secret_key}
											class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
											placeholder="sk_..."
										/>
									</div>
								</div>

								<!-- Webhook Test -->
								<div class="bg-blue-50 border border-blue-200 rounded-md p-4">
									<div class="flex items-start">
										<svg class="mt-0.5 mr-3 h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<div class="flex-1">
											<h4 class="text-sm font-medium text-blue-800">Testing Your Integration</h4>
											<p class="mt-1 text-sm text-blue-700">
												After saving your settings, you can test the webhook by creating a test subscription in Stripe. 
												The system will automatically create or update user accounts based on subscription events.
											</p>
										</div>
									</div>
								</div>
							</div>
							
							<div class="mt-6 flex justify-end">
								<button
									type="submit"
									class="btn-primary px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
								>
									Save Stripe Settings
								</button>
							</div>
						</form>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>