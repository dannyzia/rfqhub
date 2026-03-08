<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { isAdmin, user } from '$lib/stores/auth';
  import { ticketApi, type Ticket, type TicketStatus, type TicketPriority } from '$lib/stores/ticket';

  let ticket: Ticket | null = null;
  let loading = true;
  let error = '';

  // Admin update form
  let showUpdateForm = false;
  let updateStatus: TicketStatus = 'open';
  let updatePriority: TicketPriority = 'medium';
  let updateAdminNotes = '';
  let updating = false;
  let updateError = '';

  async function load() {
    loading = true;
    error = '';
    try {
      ticket = await ticketApi.getTicket($page.params.id);
      updateStatus = ticket.status;
      updatePriority = ticket.priority;
      updateAdminNotes = ticket.admin_notes || '';
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      error = apiErr?.message ?? 'Failed to load ticket.';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  function canUpdate(): boolean {
    if (!ticket || !$user) return false;
    return $isAdmin || ticket.submitted_by === $user.id;
  }

  function getBackLink(): string {
    return $isAdmin ? '/admin' : '/support/my-tickets';
  }

  async function handleUpdate() {
    if (!ticket) return;
    
    updating = true;
    updateError = '';
    
    try {
      await ticketApi.updateTicket(ticket.id, {
        status: updateStatus,
        priority: updatePriority,
        adminNotes: updateAdminNotes || undefined,
      });
      showUpdateForm = false;
      load(); // Reload ticket
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
  <title>Ticket Details – RFQ Buddy</title>
</svelte:head>

<div>
  <!-- Loading -->
  {#if loading}
    <div class="flex justify-center py-12"><div class="chaingpt-spinner"></div></div>

  <!-- Error -->
  {:else if error}
    <div class="px-5 py-4 chaingpt-clip-sm" style="background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);">
      <p class="text-sm" style="color: var(--danger);">{error}</p>
    </div>

  <!-- Ticket Details -->
  {:else if ticket}
    <!-- Header -->
    <div class="mb-6">
      <a href={getBackLink()} class="text-sm mb-2 inline-block" style="color: var(--text-muted);">
        ← {getBackLink() === '/admin' ? 'Admin Panel' : 'My Tickets'}
      </a>
      <h1 class="text-2xl font-bold mb-1" style="color: var(--text-primary);">
        #{ticket.ticket_number}: {ticket.title}
      </h1>
      <div class="flex flex-wrap items-center gap-3 mt-2">
        <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(255,153,0,.1); color: var(--orange);">
          {typeLabel[ticket.type] ?? ticket.type}
        </span>
        <span
          class="text-xs px-2.5 py-1 rounded-full border capitalize"
          style="{statusStyle[ticket.status] ?? ''}"
        >
          {ticket.status.replace('_', ' ')}
        </span>
        <div class="flex items-center gap-1">
          <span
            class="w-2 h-2 rounded-full"
            style="background: {priorityDot[ticket.priority] ?? '#6b7280'};"
          ></span>
          <span class="text-xs" style="color: var(--text-secondary);">{ticket.priority}</span>
        </div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Description -->
        <div class="chaingpt-card p-6">
          <h2 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">Description</h2>
          <div class="whitespace-pre-wrap text-sm" style="color: var(--text-secondary);">
            {ticket.description}
          </div>
        </div>

        <!-- Admin Notes -->
        {#if ticket.admin_notes}
          <div class="chaingpt-card p-6" style="background: rgba(255,153,0,.05);">
            <h2 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">Admin Notes</h2>
            <div class="whitespace-pre-wrap text-sm" style="color: var(--text-secondary);">
              {ticket.admin_notes}
            </div>
          </div>
        {/if}

        <!-- Update Form (Admin Only) -->
        {#if $isAdmin}
          <div class="chaingpt-card p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold" style="color: var(--text-primary);">Update Ticket</h2>
              <button
                on:click={() => showUpdateForm = !showUpdateForm}
                class="text-sm"
                style="color: var(--orange);"
              >
                {showUpdateForm ? 'Hide' : 'Show'}
              </button>
            </div>

            {#if showUpdateForm}
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
                <div class="flex justify-end pt-2">
                  <button
                    on:click={handleUpdate}
                    disabled={updating}
                    class="chaingpt-btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {updating ? 'Updating…' : 'Update Ticket'}
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Ticket Info -->
        <div class="chaingpt-card p-6">
          <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Ticket Information</h2>
          <div class="space-y-3 text-sm">
            <div>
              <div class="font-medium mb-1" style="color: var(--text-secondary);">Ticket Number</div>
              <div style="color: var(--text-primary);">#{ticket.ticket_number}</div>
            </div>
            <div>
              <div class="font-medium mb-1" style="color: var(--text-secondary);">Type</div>
              <div style="color: var(--text-primary);">{typeLabel[ticket.type] ?? ticket.type}</div>
            </div>
            <div>
              <div class="font-medium mb-1" style="color: var(--text-secondary);">Status</div>
              <div class="capitalize" style="color: var(--text-primary);">{ticket.status.replace('_', ' ')}</div>
            </div>
            <div>
              <div class="font-medium mb-1" style="color: var(--text-secondary);">Priority</div>
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full"
                  style="background: {priorityDot[ticket.priority] ?? '#6b7280'};"
                ></span>
                <span style="color: var(--text-primary);">{ticket.priority}</span>
              </div>
            </div>
            <div>
              <div class="font-medium mb-1" style="color: var(--text-secondary);">Created</div>
              <div style="color: var(--text-primary);">
                {new Date(ticket.created_at).toLocaleString()}
              </div>
            </div>
            {#if ticket.updated_at !== ticket.created_at}
              <div>
                <div class="font-medium mb-1" style="color: var(--text-secondary);">Last Updated</div>
                <div style="color: var(--text-primary);">
                  {new Date(ticket.updated_at).toLocaleString()}
                </div>
              </div>
            {/if}
            {#if ticket.resolved_at}
              <div>
                <div class="font-medium mb-1" style="color: var(--text-secondary);">Resolved</div>
                <div style="color: var(--text-primary);">
                  {new Date(ticket.resolved_at).toLocaleString()}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Submitted By -->
        <div class="chaingpt-card p-6">
          <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Submitted By</h2>
          <div class="space-y-2 text-sm">
            <div>
              <div class="font-medium mb-1" style="color: var(--text-secondary);">Name</div>
              <div style="color: var(--text-primary);">
                {ticket.submitter_name || 'Unknown'}
              </div>
            </div>
            <div>
              <div class="font-medium mb-1" style="color: var(--text-secondary);">Email</div>
              <div style="color: var(--text-primary);">
                {ticket.submitter_email || ticket.submitted_by}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
