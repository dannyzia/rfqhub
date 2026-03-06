<script lang="ts">
  import { ticketApi, type TicketType, type TicketPriority } from '$lib/stores/ticket';

  let type: TicketType = 'bug_report';
  let title = '';
  let description = '';
  let priority: TicketPriority = 'medium';

  let submitting = false;
  let success = false;
  let ticketNumber: number | null = null;
  let errorMsg = '';

  async function handleSubmit(e: Event) {
    e.preventDefault();
    submitting = true;
    errorMsg = '';
    success = false;

    try {
      const ticket = await ticketApi.submit({ type, title, description, priority });
      ticketNumber = ticket.ticket_number;
      success = true;
      // Reset form
      type = 'bug_report';
      title = '';
      description = '';
      priority = 'medium';
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      errorMsg = apiErr?.message ?? 'Failed to submit ticket. Please try again.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Submit Support Ticket – RFQ Buddy</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold mb-1" style="color: var(--text-primary);">Submit a Ticket</h1>
    <p style="color: var(--text-muted);">
      Have a bug to report or a feature request? Let us know and we'll get back to you.
    </p>
    <p class="text-sm mt-2" style="color: var(--text-muted);">
      See also: <a href="/faq" style="color: var(--orange); text-decoration: underline;">FAQ</a> and <a href="/guide" style="color: var(--orange); text-decoration: underline;">How-to guide</a>.
    </p>
  </div>

  <!-- Success banner -->
  {#if success}
    <div
      class="mb-6 px-5 py-4 chaingpt-clip-sm"
      style="background-color: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.35);"
    >
      <p class="font-semibold" style="color: #22c55e;">Ticket #{ticketNumber} submitted!</p>
      <p class="text-sm mt-1" style="color: var(--text-secondary);">
        You can track its progress under <a href="/support/my-tickets" style="color: var(--orange); text-decoration: underline;">My Tickets</a>.
      </p>
    </div>
  {/if}

  <!-- Error banner -->
  {#if errorMsg}
    <div
      class="mb-6 px-5 py-4 chaingpt-clip-sm"
      style="background-color: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);"
    >
      <p class="text-sm" style="color: var(--danger);">{errorMsg}</p>
    </div>
  {/if}

  <!-- Form -->
  <form on:submit={handleSubmit} class="chaingpt-card p-6 space-y-6">

    <!-- Ticket type -->
    <div>
      <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
        Ticket Type <span style="color: var(--danger);">*</span>
      </label>
      <div class="grid grid-cols-2 gap-3">
        {#each [
          { value: 'bug_report',      label: '🐛 Bug Report',      desc: 'Something is broken or not working as expected' },
          { value: 'feature_request', label: '✨ Feature Request',  desc: 'Suggest a new feature or improvement' },
        ] as opt}
          <button
            type="button"
            class="text-left px-4 py-3 chaingpt-clip-sm transition-all"
            style="
              border: 2px solid {type === opt.value ? 'var(--orange)' : 'var(--grey)'};
              background: {type === opt.value ? 'rgba(255,153,0,.08)' : 'var(--dark-card)'};
            "
            on:click={() => type = opt.value as TicketType}
          >
            <div class="font-medium text-sm" style="color: var(--text-primary);">{opt.label}</div>
            <div class="text-xs mt-0.5" style="color: var(--text-muted);">{opt.desc}</div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Title -->
    <div>
      <label for="title" class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">
        Title <span style="color: var(--danger);">*</span>
      </label>
      <input
        id="title"
        type="text"
        bind:value={title}
        required
        minlength="5"
        maxlength="200"
        placeholder={type === 'bug_report' ? 'e.g. Vendor list fails to load on dashboard' : 'e.g. Bulk export of evaluation results'}
        class="w-full px-3 py-2 chaingpt-clip-sm text-sm"
        style="background: var(--dark-lighter); border: 1px solid var(--grey); color: var(--text-primary);"
      />
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">
        Description <span style="color: var(--danger);">*</span>
      </label>
      {#if type === 'bug_report'}
        <p class="text-xs mb-2" style="color: var(--text-muted);">
          Include steps to reproduce, what you expected, and what actually happened.
        </p>
      {:else}
        <p class="text-xs mb-2" style="color: var(--text-muted);">
          Describe the problem this feature would solve and how you'd like it to work.
        </p>
      {/if}
      <textarea
        id="description"
        bind:value={description}
        required
        minlength="20"
        maxlength="5000"
        rows="7"
        placeholder={type === 'bug_report'
          ? '1. Go to...\n2. Click on...\n3. See error...'
          : 'As a user I would like to...'
        }
        class="w-full px-3 py-2 chaingpt-clip-sm text-sm resize-y"
        style="background: var(--dark-lighter); border: 1px solid var(--grey); color: var(--text-primary);"
      ></textarea>
    </div>

    <!-- Priority -->
    <div>
      <label for="priority" class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">Priority</label>
      <select
        id="priority"
        bind:value={priority}
        class="px-3 py-2 chaingpt-clip-sm text-sm"
        style="background: var(--dark-lighter); border: 1px solid var(--grey); color: var(--text-primary);"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </div>

    <!-- Submit -->
    <div class="flex items-center justify-between pt-2">
      <a href="/support/my-tickets" class="text-sm" style="color: var(--orange);">View My Tickets →</a>
      <button
        type="submit"
        disabled={submitting}
        class="chaingpt-btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Ticket'}
      </button>
    </div>
  </form>
</div>
