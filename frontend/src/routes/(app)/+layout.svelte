<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore, isAuthenticated, isLoading, user, isBuyer, isVendor, isAdmin, isEvaluator } from '$lib/stores/auth';

  let isMobileMenuOpen = false;
  let isUserMenuOpen = false;

  $: currentPath = $page.url.pathname;

  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe(authenticated => {
      if (!$isLoading && !authenticated) {
        goto('/login');
      }
    });

    return unsubscribe;
  });

  function handleLogout() {
    authStore.logout();
  }

  interface NavItem {
    href: string;
    label: string;
    roles?: string[];
  }

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tenders', label: 'Tenders' },
    { href: '/vendors', label: 'Vendors', roles: ['buyer', 'admin'] },
    { href: '/evaluator/dashboard', label: 'Evaluator Dashboard', roles: ['evaluator'] },
    { href: '/profile', label: 'Profile' },
    { href: '/faq', label: 'FAQ' },
    { href: '/guide', label: 'Guide' },
  ];

  function canAccess(item: NavItem): boolean {
    if (!item.roles) return true;
    return item.roles.some(role => $user?.roles.includes(role));
  }
</script>

{#if $isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="chaingpt-spinner"></div>
  </div>
{:else if $isAuthenticated}
  <div class="min-h-screen">
    <!-- Top Navigation -->
    <nav class="chaingpt-nav sticky top-0 z-40">
      <div class="chaingpt-container">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <a href="/dashboard" class="text-xl font-bold" style="color: var(--orange);">
                RFQ Buddy
              </a>
            </div>

            <!-- Desktop Navigation -->
            <div class="hidden sm:ml-10 sm:flex sm:space-x-1">
              {#each navItems as item}
                {#if canAccess(item)}
                  <a
                    href={item.href}
                    class="chaingpt-nav-link {currentPath.startsWith(item.href) ? 'chaingpt-nav-link-active' : ''}"
                  >
                    {item.label}
                  </a>
                {/if}
              {/each}
            </div>
          </div>

          <!-- User Menu -->
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
            <div class="relative">
              <button
                type="button"
                class="flex items-center gap-2 text-sm focus:outline-none"
                style="color: var(--text-secondary);"
                on:click={() => isUserMenuOpen = !isUserMenuOpen}
              >
                <span class="sr-only">Open user menu</span>
                <div class="h-8 w-8 flex items-center justify-center chaingpt-clip-sm" style="background-color: var(--orange); color: var(--dark);">
                  <span class="font-medium text-sm">
                    {$user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span style="color: var(--text-primary);">{$user?.name}</span>
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--grey);">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {#if isUserMenuOpen}
                <div class="absolute right-0 mt-2 w-48 chaingpt-card z-50" style="border: 1px solid var(--grey);">
                  <div class="py-1">
                    <a
                      href="/profile"
                      class="block px-4 py-2 text-sm hover:opacity-80"
                      style="color: var(--text-secondary);"
                      on:click={() => isUserMenuOpen = false}
                    >
                      Your Profile
                    </a>
                    {#if $isAdmin}
                      <a
                        href="/admin"
                        class="block px-4 py-2 text-sm hover:opacity-80"
                        style="color: var(--text-secondary);"
                        on:click={() => isUserMenuOpen = false}
                      >
                        Admin Panel
                      </a>
                    {/if}
                    <div class="chaingpt-divider-solid my-1"></div>
                    <button
                      type="button"
                      class="block w-full text-left px-4 py-2 text-sm hover:opacity-80"
                      style="color: var(--danger);"
                      on:click={handleLogout}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="flex items-center sm:hidden">
            <button
              type="button"
              class="inline-flex items-center justify-center p-2 chaingpt-clip-sm"
              style="color: var(--grey);"
              on:click={() => isMobileMenuOpen = !isMobileMenuOpen}
            >
              <span class="sr-only">Open main menu</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      {#if isMobileMenuOpen}
        <div class="sm:hidden" style="border-top: 1px solid var(--dark-lighter);">
          <div class="pt-2 pb-3 space-y-1 chaingpt-container">
            {#each navItems as item}
              {#if canAccess(item)}
                <a
                  href={item.href}
                  class="block px-3 py-2 text-base font-medium"
                  style="color: {currentPath.startsWith(item.href) ? 'var(--orange)' : 'var(--text-secondary)'};"
                  on:click={() => isMobileMenuOpen = false}
                >
                  {item.label}
                </a>
              {/if}
            {/each}
          </div>
          <div class="pt-4 pb-3" style="border-top: 1px solid var(--dark-lighter);">
            <div class="flex items-center px-4 chaingpt-container">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 flex items-center justify-center chaingpt-clip-sm" style="background-color: var(--orange); color: var(--dark);">
                  <span class="font-medium text-lg">
                    {$user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div class="ml-3">
                <div class="text-base font-medium" style="color: var(--text-primary);">{$user?.name}</div>
                <div class="text-sm font-medium" style="color: var(--text-muted);">{$user?.email}</div>
              </div>
            </div>
            <div class="mt-3 space-y-1 chaingpt-container">
              <button
                type="button"
                class="block w-full text-left px-3 py-2 text-base font-medium"
                style="color: var(--danger);"
                on:click={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      {/if}
    </nav>

    <!-- Page Content -->
    <main class="chaingpt-container chaingpt-py-4">
      <slot />
    </main>
  </div>
{/if}
