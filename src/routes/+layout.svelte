<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	export let data;

	let mobileMenuOpen = false;

	async function logout() {
		const response = await fetch('/logout', {
			method: 'POST'
		});
		if (response.ok) {
			goto('/login');
		}
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	$: isLoginPage = $page.url.pathname === '/login';
	$: isSetupPage = $page.url.pathname === '/setup';
	$: primaryColor = data?.primaryColor || '#d25a2c';
	$: navigationColor = data?.navigationColor || '#2d2d2d';
	$: linkColor = data?.linkColor || '#ffffff';
	$: logoColor = data?.logoColor || '#d25a2c';
	$: logoFontColor = data?.logoFontColor || '#ffffff';

	// Apply all colors as CSS custom properties
	$: if (browser && primaryColor && navigationColor && linkColor && logoColor && logoFontColor) {
		document.documentElement.style.setProperty('--primary-color', primaryColor);
		document.documentElement.style.setProperty('--navigation-color', navigationColor);
		document.documentElement.style.setProperty('--link-color', linkColor);
		document.documentElement.style.setProperty('--logo-color', logoColor);
		document.documentElement.style.setProperty('--logo-font-color', logoFontColor);
		
		// Generate lighter/darker variants for primary color
		const hex = primaryColor.replace('#', '');
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		
		// Create hover variant (slightly darker)
		const hoverR = Math.max(0, r - 20);
		const hoverG = Math.max(0, g - 20);
		const hoverB = Math.max(0, b - 20);
		const hoverColor = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;
		
		document.documentElement.style.setProperty('--primary-color-hover', hoverColor);
		
		// Generate link color hover variant
		const linkHex = linkColor.replace('#', '');
		const linkR = parseInt(linkHex.substr(0, 2), 16);
		const linkG = parseInt(linkHex.substr(2, 2), 16);
		const linkB = parseInt(linkHex.substr(4, 2), 16);
		
		const linkHoverR = Math.max(0, linkR - 20);
		const linkHoverG = Math.max(0, linkG - 20);
		const linkHoverB = Math.max(0, linkB - 20);
		const linkHoverColor = `#${linkHoverR.toString(16).padStart(2, '0')}${linkHoverG.toString(16).padStart(2, '0')}${linkHoverB.toString(16).padStart(2, '0')}`;
		
		document.documentElement.style.setProperty('--link-color-hover', linkHoverColor);
	}
</script>

<svelte:head>
	<style>
		:root {
			--primary-color: #d25a2c;
			--primary-color-hover: #b8481f;
			--navigation-color: #2d2d2d;
			--link-color: #ffffff;
			--link-color-hover: #e5e5e5;
			--logo-color: #d25a2c;
			--logo-font-color: #ffffff;
		}
		
		.primary-active {
			border-color: var(--link-color) !important;
			color: var(--link-color) !important;
		}
		
		.mobile-active {
			color: var(--link-color) !important;
			background-color: rgba(255, 255, 255, 0.1) !important;
		}
		
		.btn-primary {
			background-color: var(--primary-color);
			border-color: var(--primary-color);
		}
		
		.btn-primary:hover {
			background-color: var(--primary-color-hover);
			border-color: var(--primary-color-hover);
		}
		
		.text-primary {
			color: var(--primary-color);
		}
		
		.text-primary:hover {
			color: var(--primary-color-hover);
		}
		
		.text-link {
			color: var(--link-color);
		}
		
		.text-link:hover {
			color: var(--link-color-hover);
		}
		
		.bg-primary {
			background-color: var(--primary-color);
		}
		
		.bg-primary:hover {
			background-color: var(--primary-color-hover);
		}
		
		.border-primary {
			border-color: var(--primary-color);
		}
		
		.focus-ring-primary:focus {
			ring-color: var(--primary-color);
			border-color: var(--primary-color);
		}
		
		.nav-bg {
			background-color: var(--navigation-color);
		}
		
		/* Dynamic logo color */
		.logo-svg {
			filter: hue-rotate(0deg);
		}
	</style>
</svelte:head>

{#if isLoginPage || isSetupPage}
	<slot />
{:else}
	<div class="min-h-screen bg-gray-50">
		<!-- Navigation -->
		<nav class="shadow nav-bg">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center h-16">
					<!-- Logo on the left -->
					<div class="flex-shrink-0">
						<a href="/" class="flex items-center" on:click={closeMobileMenu}>
							<svg 
								width="250" height="48" viewBox="0 0 250 48" 
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 sm:h-8 w-auto max-w-none logo-svg"
							>
								<!-- Orange rounded rectangle background with dynamic color -->
								<rect x="4" y="4" width="64" height="40" rx="8" ry="8" fill="var(--logo-color)"/>
								
								<!-- White person icon - circle head -->
								<circle cx="24" cy="18" r="5" fill="white"/>
								
								<!-- White person icon - body (curved bottom) with shorter body and higher waist -->
								<path d="M16 30 C16 27, 19.5 25, 24 25 C28.5 25, 32 27, 32 30 L32 36 C32 37, 31 38, 30 38 L18 38 C17 38, 16 37, 16 36 Z" fill="white"/>
								
								<!-- White horizontal lines for text -->
								<rect x="38" y="16" width="22" height="3" rx="1.5" fill="white"/>
								<rect x="38" y="22" width="22" height="3" rx="1.5" fill="white"/>
								<rect x="38" y="28" width="16" height="3" rx="1.5" fill="white"/>
								
								<!-- MakerPass text - much bigger to match card height -->
								<text x="76" y="36" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="var(--logo-font-color)">MakerPass</text>
							</svg>
						</a>
					</div>
					
					<!-- Desktop navigation -->
					<div class="hidden md:flex md:space-x-8 absolute left-1/2 transform -translate-x-1/2">
						<a
							href="/"
							class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center"
							class:primary-active={$page.url.pathname === '/'}
						>
							Dashboard
						</a>
						<a
							href="/resources"
							class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center"
							class:primary-active={$page.url.pathname === '/resources'}
						>
							Resources
						</a>
						<a
							href="/maintenance"
							class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center"
							class:primary-active={$page.url.pathname === '/maintenance'}
						>
							Maintenance
						</a>
						<a
							href="/users"
							class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center"
							class:primary-active={$page.url.pathname === '/users'}
						>
							Users
						</a>
						<a
							href="/logs"
							class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center"
							class:primary-active={$page.url.pathname === '/logs'}
						>
							Access Logs
						</a>
						<a
							href="/settings"
							class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center"
							class:primary-active={$page.url.pathname === '/settings'}
						>
							Settings
						</a>
					</div>
					
					<!-- Mobile menu button and logout -->
					<div class="flex items-center space-x-2">
						<!-- Logout button - hidden on mobile -->
						<button
							on:click={logout}
							class="hidden md:block text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
						>
							Logout
						</button>
						
						<!-- Mobile menu button -->
						<button
							type="button"
							class="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 p-2"
							on:click={toggleMobileMenu}
						>
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if mobileMenuOpen}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								{:else}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
								{/if}
							</svg>
						</button>
					</div>
				</div>
				
				<!-- Mobile menu -->
				{#if mobileMenuOpen}
					<div class="md:hidden">
						<div class="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
							<a
								href="/"
								class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
								class:mobile-active={$page.url.pathname === '/'}
								on:click={closeMobileMenu}
							>
								Dashboard
							</a>
							<a
								href="/resources"
								class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
								class:mobile-active={$page.url.pathname === '/resources'}
								on:click={closeMobileMenu}
							>
								Resources
							</a>
							<a
								href="/maintenance"
								class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
								class:mobile-active={$page.url.pathname === '/maintenance'}
								on:click={closeMobileMenu}
							>
								Maintenance
							</a>
							<a
								href="/users"
								class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
								class:mobile-active={$page.url.pathname === '/users'}
								on:click={closeMobileMenu}
							>
								Users
							</a>
							<a
								href="/logs"
								class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
								class:mobile-active={$page.url.pathname === '/logs'}
								on:click={closeMobileMenu}
							>
								Access Logs
							</a>
							<a
								href="/settings"
								class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
								class:mobile-active={$page.url.pathname === '/settings'}
								on:click={closeMobileMenu}
							>
								Settings
							</a>
							
							<!-- Logout in mobile menu -->
							<div class="border-t border-gray-600 pt-2 mt-2">
								<button
									on:click={() => { logout(); closeMobileMenu(); }}
									class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
								>
									Logout
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</nav>

		<!-- Main content -->
		<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			<slot />
		</main>
	</div>
{/if}
