<script>
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	
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

		<!-- API Configuration Section -->
		<div class="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
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

		<!-- Theme Configuration Section -->
		<div class="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
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

		<!-- Reset Section -->
		<div class="bg-white p-4 sm:p-6 rounded-lg shadow">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Reset Settings</h2>
			<div class="space-y-4">
				<div>
					<button
						type="button"
						on:click={() => {
							if (confirm('Reset all colors to default theme?')) {
								primaryColor = '#d25a2c';
								navigationColor = '#2d2d2d';
								linkColor = '#ffffff';
								logoColor = '#d25a2c';
								logoFontColor = '#ffffff';
								applyColorThemes();
								// Submit forms to save the reset
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
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 w-full sm:w-auto"
					>
						Reset All Colors to Default
					</button>
					<p class="mt-2 text-sm text-gray-500">
						Reset all theme colors to the default MakerPass color scheme.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
