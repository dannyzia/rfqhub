<script lang="ts">
  import { onMount } from 'svelte';
  import { ticketApi, type Ticket, type TicketType, type TicketStatus } from '$lib/stores/ticket';

  let tickets: Ticket[] = [];
  let loading = true;
  let error = '';
  let total = 0;
  let totalPages = 1;
  let page = 1;
  const limit = 20;

  let filterType: TicketType | '' = '';
  let filterStatus: TicketStatus | '' = '';

  async function load() {
    loading = true;
    error = '';
    try {
      const result = await ticketApi.getMyTickets({
        page,
        limit,
        type:   filterType   || undefined,
        status: filterStatus || undefined,
      });
      tickets    = result.tickets;
      total      = result.total;
      totalPages = result.totalPages;
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      error = apiErr?.message ?? 'Failed to load tickets.';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  function applyFilters() { page = 1; load(); }

  const typeLabel: Record<string, string> = {
    bug_report:      '🐛 Bug Report',
    feature_request: '✨ Feature Request',
  };

  const statusStyle: Record<string, string> = {
    open:             'color:#f59e0b; border-color:rgba(245,158,11,.4)',
    in_progress:      'color:#3b82f6; border-color:rgba(59,130,246,.4)',
    resolved:         'color:#22c55e; border-color:rgba(34,197,94,.4)',
    closed:           'color:var(--text-muted); border-color:var(--grey)',
    wont_fix:         'color:#ef4444; border-color:rgba(239,68,68,.4)',
  };

  const priorityDot: Record<string, string> = {
    low:      '#6b7280',
    medium:   '#f59e0b',
    high:     '#f97316',
    critical: '#ef4444',
  };
</script>

<svelte:head>
  <title>My Tickets – RFQ Buddy</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold" style="color: var(--text-primary);">My Tickets</h1>
      <p class="text-sm mt-0.5" style="color: var(--text-muted);">Track your bug reports and feature requests</p>
    </div>
    <a href="/support" class="chaingpt-btn-primary px-4 py-2 text-sm font-medium">+ New Ticket</a>
  </div>

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 mb-6">
    <select
      bind:value={filterType}
      on:change={applyFilters}
      class="px-3 py-1.5 text-sm chaingpt-clip-sm"
      style="background: var(--dark-card); border: 1px solid var(--grey); color: var(--text-secondary);"
    >
      <option value="">All Types</option>
      <option value="bug_report">Bug Report</option>
      <option value="feature_request">Feature Request</option>
    </select>

    <select
      bind:value={filterStatus}
      on:change={applyFilters}
      class="px-3 py-1.5 text-sm chaingpt-clip-sm"
      style="background: var(--dark-card); border: 1px solid var(--grey); color: var(--text-secondary);"
    >
      <option value="">All Statuses</option>
      <option value="open">Open</option>
      <option value="in_progress">In Progress</option>
      <option value="resolved">Resolved</option>
      <option value="closed">Closed</option>
      <option value="wont_fix">Won't Fix</option>
    </select>
  </div>

  <!-- Loading -->
  {#if loading}
    <div class="flex justify-center py-12"><div class="chaingpt-spinner"></div></div>

  <!-- Error -->
  {:else if error}
    <div class="px-5 py-4 chaingpt-clip-sm" style="background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);">
      <p class="text-sm" style="color: var(--danger);">{error}</p>
    </div>

  <!-- Empty -->
  {:else if tickets.length === 0}
    <div class="text-center py-16 chaingpt-card">
      <p class="text-4xl mb-3">🎫</p>
      <p class="font-medium mb-1" style="color: var(--text-primary);">No tickets yet</p>
      <p class="text-sm mb-5" style="color: var(--text-muted);">Submit a bug report or feature request and it will appear here.</p>
      <a href="/support" class="chaingpt-btn-primary px-5 py-2 text-sm">Submit a Ticket</a>
    </div>

  <!-- List -->
  {:else}
    <div class="space-y-3">
      {#each tickets as ticket}
        <a
          href="/support/tickets/{ticket.id}"
          class="chaingpt-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <!-- Left: number + type + title -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono" style="color: var(--text-muted);">#{ticket.ticket_number}</span>
              <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(255,153,0,.1); color: var(--orange);">
                {typeLabel[ticket.type] ?? ticket.type}
              </span>
            </div>
            <p class="font-medium truncate" style="color: var(--text-primary);">{ticket.title}</p>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">
              {new Date(ticket.created_at).toLocaleDateString()}
            </p>
          </div>

          <!-- Right: priority + status -->
          <div class="flex items-center gap-3 shrink-0">
            <!-- Priority dot -->
            <span
              class="w-2 h-2 rounded-full"
              style="background: {priorityDot[ticket.priority] ?? '#6b7280'};"
              title="Priority: {ticket.priority}"
            ></span>

            <!-- Status badge -->
            <span
              class="text-xs px-2.5 py-1 rounded-full border capitalize"
              style="{statusStyle[ticket.status] ?? ''}"
            >
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
        </a>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-between mt-6">
        <p class="text-sm" style="color: var(--text-muted);">
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
        </p>
        <div class="flex gap-2">
          <button
            disabled={page === 1}
            on:click={() => { page--; load(); }}
            class="px-3 py-1.5 text-sm chaingpt-clip-sm disabled:opacity-40"
            style="border: 1px solid var(--grey); color: var(--text-secondary);"
          >← Prev</button>
          <button
            disabled={page === totalPages}
            on:click={() => { page++; load(); }}
            class="px-3 py-1.5 text-sm chaingpt-clip-sm disabled:opacity-40"
            style="border: 1px solid var(--grey); color: var(--text-secondary);"
          >Next →</button>
        </div>
      </div>
    {/if}
  {/if}
</div>
