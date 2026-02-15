<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/utils/api';
  import { login } from '$lib/stores/auth';

  let email = '';
  let password = '';
  let errorMessage = '';
  let isSubmitting = false;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errorMessage = '';
    isSubmitting = true;

    try {
      await login(email, password);
    } catch (err: unknown) {
      errorMessage = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Login failed. Please check your credentials and try again.';
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Login - RFQ Buddy</title>
</svelte:head>

<div class="chaingpt-animate-fade">
  <div class="chaingpt-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <div class="chaingpt-card" style="max-width: 28rem; width: 100%;">
      <div class="chaingpt-flex chaingpt-flex-col chaingpt-items-center chaingpt-mb-6">
        <span style="font-size: 3rem;">🔐</span>
        <h1 class="chaingpt-title" style="font-size: 2rem;">RFQ Buddy</h1>
      </div>
      <p class="chaingpt-text-muted" style="text-align: center; margin-bottom: 1.5rem;">
        Sign in to your account
      </p>

      {#if errorMessage}
        <div class="chaingpt-card" style="background-color: var(--color-danger-light); border: 1px solid var(--color-danger); margin-bottom: 1rem;">
          <p class="chaingpt-text" style="color: var(--color-danger);">{errorMessage}</p>
        </div>
      {/if}

      <form on:submit={handleSubmit} class="chaingpt-flex chaingpt-flex-col chaingpt-gap-4">
        <div>
          <label for="email" class="chaingpt-label required">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            class="chaingpt-input"
            placeholder="you@example.com"
            required
            autocomplete="email"
          />
        </div>
        <div>
          <label for="password" class="chaingpt-label required">Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            class="chaingpt-input"
            placeholder="••••••••••"
            required
            autocomplete="current-password"
          />
        </div>
        <button
          type="submit"
          class="chaingpt-btn chaingpt-btn-primary chaingpt-btn-block"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <span class="chaingpt-spinner"></span>
            Signing in...
          {:else}
            Sign In
          {/if}
        </button>
      </form>

      <div class="chaingpt-divider-solid chaingpt-my-4"></div>

      <div class="chaingpt-text-muted" style="text-align: center;">
        <p style="margin: 0;">Don't have an account?</p>
        <a href="/register" class="chaingpt-link">Create one</a>
      </div>
    </div>
  </div>
</div>
