<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAdmin } from '$lib/stores/auth';
  import { ticketApi, type Ticket, type TicketType, type TicketStatus, type TicketPriority } from '$lib/stores/ticket';

  let tickets: Ticket[] = [];
  let loading = true;
  let error = '';
  let total = 0;
  let totalPages = 1;
  let page = 1;
  const limit = 20;

  let filterType: TicketType | '' = '';
  let filterStatus: TicketStatus | '' = '';
  let filterPriority: TicketPriority | '' = '';

  // Quick update modal
  let showUpdateModal = false;
  let updatingTicket: Ticket | null = null;
  let updateStatus: TicketStatus = 'open';
  let updatePriority: TicketPriority = 'medium';
  let updateAdminNotes = '';
  let updating = false;
  let updateError = '';

  async function load() {
    loading = true;
    error = '';
    try {
      const result = await ticketApi.getAllTickets({
        page,
        limit,
        type: filterType || undefined,
        status: filterStatus || undefined,
      });
      tickets = result.tickets;
      total = result.total;
      totalPages = result.totalPages;
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      error = apiErr?.message ?? 'Failed to load tickets.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!$isAdmin) {
      goto('/dashboard');
      return;
    }
    load();
  });

  function applyFilters() {
    page = 1;
    load();
  }

  function openUpdateModal(ticket: Ticket) {
    updatingTicket = ticket;
    updateStatus = ticket.status;
    updatePriority = ticket.priority;
    updateAdminNotes = ticket.admin_notes || '';
    updateError = '';
    showUpdateModal = true;
  }

  async function handleUpdate() {
    if (!updatingTicket) return;
    
    updating = true;
    updateError = '';
    
    try {
      await ticketApi.updateTicket(updatingTicket.id, {
        status: updateStatus,
        priority: updatePriority,
        adminNotes: updateAdminNotes || undefined,
      });
      showUpdateModal = false;
      load(); // Reload tickets
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      updateError = apiErr?.message ?? 'Failed to update ticket.';
    } finally {
      updating = false;
    }
  }

  const typeLabel: Record<string, string> = {
    bug_report: '🐛 Bug Report',
    feature_request: '✨ Feature Request',
  };

  const statusStyle: Record<string, string> = {
    open: 'color:#f59e0b; border-color:rgba(245,158,11,.4)',
    in_progress: 'color:#3b82f6; border-color:rgba(59,130,246,.4)',
    resolved: 'color:#22c55e; border-color:rgba(34,197,94,.4)',
    closed: 'color:var(--text-muted); border-color:var(--grey)',
    wont_fix: 'color:#ef4444; border-color:rgba(239,68,68,.4)',
  };

  const priorityDot: Record<string, string> = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };
</script>

<svelte:head>
  <title>Admin Panel – RFQ Buddy</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-1" style="color: var(--text-primary);">Admin Panel</h1>
    <p class="text-sm" style="color: var(--text-muted);">Manage all support tickets</p>
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

    <select
      bind:value={filterPriority}
      on:change={applyFilters}
      class="px-3 py-1.5 text-sm chaingpt-clip-sm"
      style="background: var(--dark-card); border: 1px solid var(--grey); color: var(--text-secondary);"
    >
      <option value="">All Priorities</option>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
      <option value="critical">Critical</option>
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
      <p class="text-4xl mb-3">📋</p>
      <p class="font-medium mb-1" style="color: var(--text-primary);">No tickets found</p>
      <p class="text-sm" style="color: var(--text-muted);">Try adjusting your filters or check back later.</p>
    </div>

  <!-- Table -->
  {:else}
    <div class="chaingpt-card overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr style="border-bottom: 1px solid var(--grey);">
            <th class="text-left px-4 py-3 font-medium" style="color: var(--text-secondary);">ID</th>
            <th class="text-left px-4 py-3 font-medium" style="color: var(--text-secondary);">Title</th>
            <th class="text-left px-4 py-3 font-medium" style="color: var(--text-secondary);">Type</th>
            <th class="text-left px-4 py-3 font-medium" style="color: var(--text-secondary);">Priority</th>
            <th class="text-left px-4 py-3 font-medium" style="color: var(--text-secondary);">Status</th>
            <th class="text-left px-4 py-3 font-medium" style="color: var(--text-secondary);">Created By</th>
            <th class="text-left px-4 py-3 font-medium" style="color: var(--text-secondary);">Created</th>
            <th class="text-left px-4 py-3 font-medium" style="color: var(--text-secondary);">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each tickets as ticket}
            <tr style="border-bottom: 1px solid var(--dark-lighter);">
              <td class="px-4 py-3 font-mono" style="color: var(--text-muted);">#{ticket.ticket_number}</td>
              <td class="px-4 py-3">
                <a href="/support/tickets/{ticket.id}" class="hover:underline" style="color: var(--text-primary);">
                  {ticket.title}
                </a>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(255,153,0,.1); color: var(--orange);">
                  {typeLabel[ticket.type] ?? ticket.type}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="w-2 h-2 rounded-full inline-block mr-2"
                  style="background: {priorityDot[ticket.priority] ?? '#6b7280'};"
                  title="Priority: {ticket.priority}"
                ></span>
                <span style="color: var(--text-secondary);">{ticket.priority}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-xs px-2.5 py-1 rounded-full border capitalize"
                  style="{statusStyle[ticket.status] ?? ''}"
                >
                  {ticket.status.replace('_', ' ')}
                </span>
              </td>
              <td class="px-4 py-3" style="color: var(--text-secondary);">
                {ticket.submitter_name || ticket.submitted_by}
              </td>
              <td class="px-4 py-3" style="color: var(--text-muted);">
                {new Date(ticket.created_at).toLocaleDateString()}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <a
                    href="/support/tickets/{ticket.id}"
                    class="text-xs px-2 py-1 chaingpt-clip-sm"
                    style="border: 1px solid var(--grey); color: var(--text-secondary);"
                  >
                    View
                  </a>
                  <button
                    on:click={() => openUpdateModal(ticket)}
                    class="text-xs px-2 py-1 chaingpt-clip-sm"
                    style="border: 1px solid var(--orange); color: var(--orange);"
                  >
                    Update
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
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

<!-- Update Modal -->
{#if showUpdateModal && updatingTicket}
  <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,.7);">
    <div class="chaingpt-card w-full max-w-lg mx-4 p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold" style="color: var(--text-primary);">Update Ticket #{updatingTicket.ticket_number}</h2>
        <button
          on:click={() => showUpdateModal = false}
          class="text-xl"
          style="color: var(--text-muted);"
        >×</button>
      </div>

      {#if updateError}
        <div
          class="mb-4 px-4 py-3 chaingpt-clip-sm"
          style="background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);"
        >
          <p class="text-sm" style="color: var(--danger);">{updateError}</p>
        </div>
      {/if}

      <div class="space-y-4">
        <!-- Status -->
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">Status</label>
          <select
            bind:value={updateStatus}
            class="w-full px-3 py-2 chaingpt-clip-sm text-sm"
            style="background: var(--dark-lighter); border: 1px solid var(--grey); color: var(--text-primary);"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="wont_fix">Won't Fix</option>
          </select>
        </div>

        <!-- Priority -->
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">Priority</label>
          <select
            bind:value={updatePriority}
            class="w-full px-3 py-2 chaingpt-clip-sm text-sm"
            style="background: var(--dark-lighter); border: 1px solid var(--grey); color: var(--text-primary);"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <!-- Admin Notes -->
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">Admin Notes</label>
          <textarea
            bind:value={updateAdminNotes}
            rows="4"
            placeholder="Add notes for other admins or the ticket submitter..."
            class="w-full px-3 py-2 chaingpt-clip-sm text-sm resize-y"
            style="background: var(--dark-lighter); border: 1px solid var(--grey); color: var(--text-primary);"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            on:click={() => showUpdateModal = false}
            disabled={updating}
            class="px-4 py-2 text-sm chaingpt-clip-sm disabled:opacity-50"
            style="border: 1px solid var(--grey); color: var(--text-secondary);"
          >
            Cancel
          </button>
          <button
            on:click={handleUpdate}
            disabled={updating}
            class="chaingpt-btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {updating ? 'Updating…' : 'Update Ticket'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
