<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/utils/api';
  import { authStore, isAuthenticated, isLoading } from '$lib/stores/auth';

  let formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as 'buyer' | 'vendor',
  };

  let errorMessage = '';

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errorMessage = '';

    if (formData.password !== formData.confirmPassword) {
      errorMessage = 'Passwords do not match.';
      return;
    }

    try {
      await authStore.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      goto('/dashboard');
    } catch (err: unknown) {
      errorMessage = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Registration failed. Please try again.';
    }
  }
</script>

<svelte:head>
  <title>Register - RFQ Buddy</title>
</svelte:head>

<div class="chaingpt-animate-fade">
  <div class="chaingpt-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <div class="chaingpt-card" style="max-width: 32rem; width: 100%;">
      <div class="chaingpt-flex chaingpt-flex-col chaingpt-items-center chaingpt-mb-6">
        <span style="font-size: 3rem;">🔐</span>
        <h1 class="chaingpt-title" style="font-size: 2rem;">RFQ Buddy</h1>
      </div>
      <p class="chaingpt-subtitle" style="text-align: center; margin-bottom: 1.5rem;">
        Create your account
      </p>

      {#if errorMessage}
        <div class="chaingpt-card" style="background-color: var(--color-danger-light); border: 1px solid var(--color-danger); margin-bottom: 1rem;">
          <p class="chaingpt-text" style="color: var(--color-danger);">{errorMessage}</p>
        </div>
      {/if}

      <form on:submit={handleSubmit} class="chaingpt-flex chaingpt-flex-col chaingpt-gap-4">
        <div>
          <label for="name" class="chaingpt-label required">Full Name</label>
          <input
            id="name"
            type="text"
            bind:value={formData.name}
            class="chaingpt-input"
            placeholder="John Doe"
            required
            autocomplete="name"
          />
        </div>
        <div>
          <label for="email" class="chaingpt-label required">Email</label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            class="chaingpt-input"
            placeholder="you@example.com"
            required
            autocomplete="email"
          />
        </div>
        <div>
          <label for="role" class="chaingpt-label required">Role</label>
          <select id="role" bind:value={formData.role} class="chaingpt-select" required>
            <option value="buyer">Buyer</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>
        <div>
          <label for="password" class="chaingpt-label required">Password</label>
          <input
            id="password"
            type="password"
            bind:value={formData.password}
            class="chaingpt-input"
            placeholder="•••••••••"
            required
            autocomplete="new-password"
          />
        </div>
        <div>
          <label for="confirmPassword" class="chaingpt-label required">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={formData.confirmPassword}
            class="chaingpt-input"
            placeholder="••••••••"
            required
            autocomplete="new-password"
          />
        </div>
        <button
          type="submit"
          class="chaingpt-btn chaingpt-btn-primary chaingpt-btn-block"
          disabled={isLoading}
        >
          {#if isLoading}
            <span class="chaingpt-spinner"></span>
            Creating account...
          {:else}
            Create Account
          {/if}
        </button>
      </form>

      <div class="chaingpt-divider-solid chaingpt-my-4"></div>

      <div class="chaingpt-text-muted" style="text-align: center;">
        <p style="margin: 0;">Already have an account?</p>
        <a href="/login" class="chaingpt-link">Sign in</a>
      </div>
    </div>
  </div>
</div>
