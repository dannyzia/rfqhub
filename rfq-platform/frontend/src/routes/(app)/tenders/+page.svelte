<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';
  import { isBuyer } from '$lib/stores/auth';
 
  interface Tender {
    id: string;
    tenderNumber: string;
    title: string;
    tenderType: string;
    visibility: string;
    procurementType: string;
    currency: string;
    status: string;
    submissionDeadline: string;
    createdAt: string;
  }
 
  let statusFilter = '';
  let typeFilter = '';
  let searchQuery = '';
 
  $: queryParams = new URLSearchParams();
  $: {
    if (statusFilter) queryParams.set('status', statusFilter);
    if (typeFilter) queryParams.set('type', typeFilter);
    if (searchQuery) queryParams.set('search', searchQuery);
  }
 
  $: tendersQuery = createQuery(() => ({
    queryKey: ['tenders', statusFilter, typeFilter, searchQuery],
    queryFn: async () => api.get<{ tenders: Tender[]; total: number }>(`/tenders?${queryParams.toString()}`),
  }));
 
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'chaingpt-badge-info';
      case 'published': return 'chaingpt-badge-success';
      case 'clarification': return 'chaingpt-badge-warning';
      case 'closed': return 'chaingpt-badge-warning';
      case 'tech_eval': return 'chaingpt-badge-info';
      case 'comm_eval': return 'chaingpt-badge-info';
      case 'awarded': return 'chaingpt-badge-success';
      case 'cancelled': return 'chaingpt-badge-danger';
      default: return 'chaingpt-badge-info';
    }
  }
 
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
 
  function isDeadlineSoon(deadline: string): boolean {
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 days
  }
</script>
 
<svelte:head>
  <title>Tenders - RFQ Buddy</title>
</svelte:head>
 
<div class="chaingpt-animate-fade">
  <!-- Header -->
  <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center chaingpt-mb-6">
    <h1 class="chaingpt-title">Tenders</h1>
    {#if $isBuyer}
      <a href="/tenders/new" class="chaingpt-btn chaingpt-btn-primary">
        + Create Tender
      </a>
    {/if}
  </div>
 
  <!-- Filters -->
  <div class="chaingpt-card">
    <div class="chaingpt-grid chaingpt-grid-2 md:chaingpt-grid-4">
      <div>
        <label for="search" class="chaingpt-label">Search</label>
        <input
          type="text"
          id="search"
          bind:value={searchQuery}
          class="chaingpt-input"
          placeholder="Search tenders..."
        />
      </div>
      <div>
        <label for="status" class="chaingpt-label">Status</label>
        <select id="status" bind:value={statusFilter} class="chaingpt-select">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="tech_eval">Technical Evaluation</option>
          <option value="comm_eval">Commercial Evaluation</option>
          <option value="awarded">Awarded</option>
        </select>
      </div>
      <div>
        <label for="type" class="chaingpt-label">Type</label>
        <select id="type" bind:value={typeFilter} class="chaingpt-select">
          <option value="">All Types</option>
          <option value="RFQ">RFQ</option>
          <option value="TENDER">Tender</option>
        </select>
      </div>
      <div class="chaingpt-flex chaingpt-items-end">
        <button
          type="button"
          class="chaingpt-btn chaingpt-btn-secondary"
          on:click={() => { statusFilter = ''; typeFilter = ''; searchQuery = ''; }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  </div>
 
  <!-- Tenders List -->
  {#if tendersQuery.isLoading}
    <div class="chaingpt-flex chaingpt-flex-col chaingpt-gap-4">
      {#each Array(5) as _}
        <div class="chaingpt-card">
          <div class="h-12 w-1/2 mb-2" style="background-color: var(--dark-lighter);"></div>
          <div class="h-16 w-1/4 mb-2" style="background-color: var(--dark-lighter);"></div>
        </div>
      {/each}
    </div>
  {:else if tendersQuery.error}
    <div class="chaingpt-card" style="background-color: var(--color-danger-light); border: 1px solid var(--color-danger);">
      <p class="chaingpt-text" style="color: var(--color-danger);">Error loading tenders. Please try again.</p>
    </div>
  {:else if tendersQuery.data?.tenders?.length}
    <div class="chaingpt-flex chaingpt-flex-col chaingpt-gap-4">
      {#each tendersQuery.data.tenders as tender}
        <a href="/tenders/{tender.id}" class="chaingpt-card chaingpt-card-hover" style="text-decoration: none; display: block;">
          <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-start">
            <div class="chaingpt-flex-1">
              <div class="chaingpt-flex chaingpt-items-center chaingpt-gap-4 chaingpt-mb-2">
                <span class="chaingpt-text-muted">{tender.tenderNumber}</span>
                <span class="chaingpt-badge {getStatusBadgeClass(tender.status)}">
                  {tender.status.replace('_', ' ')}
                </span>
                {#if tender.status === 'published' && isDeadlineSoon(tender.submissionDeadline)}
                  <span class="chaingpt-badge chaingpt-badge-warning">Deadline Soon!</span>
                {/if}
              </div>
              <h3 class="chaingpt-title" style="font-size: 1.125rem; margin-bottom: 0.5rem;">{tender.title}</h3>
              <div class="chaingpt-flex chaingpt-flex-wrap chaingpt-gap-4">
                <span class="chaingpt-text-muted">Type: {tender.tenderType}</span>
                <span class="chaingpt-text-muted">Visibility: {tender.visibility}</span>
                <span class="chaingpt-text-muted">Currency: {tender.currency}</span>
                <span class="chaingpt-text-muted">Deadline: {formatDate(tender.submissionDeadline)}</span>
              </div>
            </div>
            <svg class="w-5 h-5" style="color: var(--grey);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      {/each}
    </div>
 
    {#if tendersQuery.data.total > tendersQuery.data.tenders.length}
      <div class="chaingpt-flex chaingpt-justify-center chaingpt-py-4">
        <p class="chaingpt-text-muted">
          Showing {tendersQuery.data.tenders.length} of {tendersQuery.data.total} tenders
        </p>
      </div>
    {/if}
  {:else}
    <div class="chaingpt-card chaingpt-py-12" style="text-align: center;">
      <svg class="mx-auto h-12 w-12" style="color: var(--grey);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="chaingpt-title" style="font-size: 1rem; margin-top: 0.5rem;">No tenders found</h3>
      <p class="chaingpt-text-muted" style="margin-top: 0.5rem;">
        {#if $isBuyer}
          Get started by creating a new tender.
        {:else}
          Check back later for new opportunities.
        {/if}
      </p>
      {#if $isBuyer}
        <div class="chaingpt-mt-6">
          <a href="/tenders/new" class="chaingpt-btn chaingpt-btn-primary">
            + Create Tender
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>
