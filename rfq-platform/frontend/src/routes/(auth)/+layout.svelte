<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated, isLoading } from '$lib/stores/auth';

  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe(authenticated => {
      if (authenticated) {
        goto('/dashboard');
      }
    });

    return unsubscribe;
  });
</script>

{#if $isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center chaingpt-body">
    <!-- Body lines background effect -->
    <div class="chaingpt-body-lines">
      <!-- Vertical lines -->
      <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-left"></div>
      <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-left-middle"></div>
      <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-center"></div>
      <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-right-middle"></div>
      <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-right"></div>
      <!-- Horizontal lines -->
      <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-top"></div>
      <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-top-middle"></div>
      <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-middle"></div>
      <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-bottom-middle"></div>
      <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-bottom"></div>
    </div>
    <div class="max-w-md w-full relative z-10">
      <slot />
    </div>
  </div>
{/if}
