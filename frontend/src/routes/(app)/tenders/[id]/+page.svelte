<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';
  import { page } from '$app/stores';
  import { isBuyer, isVendor } from '$lib/stores/auth';

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
    bidOpeningTime: string;
    createdAt: string;
    description?: string;
    budget?: number;
    fundAllocation?: number;
    bidSecurityAmount?: number;
    twoEnvelopeSystem: boolean;
    validityDays: number;
    priceBasis: string;
    preBidMeetingDate?: string;
    preBidMeetingLink?: string;
  }

  const tenderQuery = createQuery(() => ({
    queryKey: ['tender', $page.params.id],
    queryFn: async () => api.get<Tender>(`/tenders/${$page.params.id}`),
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
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  function isDeadlineSoon(deadline: string): boolean {
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 days
  }
</script>

<svelte:head>
  <title>{#if tenderQuery.data?.title}{tenderQuery.data?.title} - RFQ Buddy</title>
</svelte:head>

{#if tenderQuery.isLoading}
  <div class="chaingpt-container chaingpt-py-4">
    <div class="chaingpt-card">
      <div class="chaingpt-flex chaingpt-items-center chaingpt-gap-4">
        <div class="chaingpt-spinner"></div>
        <p class="chaingpt-text-muted">Loading tender details...</p>
      </div>
    </div>
  {:else if tenderQuery.error}
    <div class="chaingpt-card" style="background-color: var(--color-danger-light); border: 1px solid var(--color-danger);">
      <p class="chaingpt-text" style="color: var(--color-danger);">Error loading tender. Please try again.</p>
    </div>
  {:else if tenderQuery.data}
  <div class="chaingpt-animate-fade">
    <!-- Header -->
    <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center chaingpt-mb-6">
      <div class="chaingpt-flex chaingpt-items-center chaingpt-gap-4">
        <a href="/tenders" class="chaingpt-link">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 class="chaingpt-title">{tenderQuery.data.title}</h1>
      </div>
      <span class="chaingpt-badge {getStatusBadgeClass(tenderQuery.data.status)}">
        {tenderQuery.data.status.replace('_', ' ')}
      </span>
    </div>

    <!-- Tender Number -->
    <div class="chaingpt-card chaingpt-mb-6">
      <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center">
        <span class="chaingpt-text-muted">Tender Number</span>
        <span class="chaingpt-text" style="font-weight: 500;">{tenderQuery.data.tenderNumber}</span>
      </div>
    </div>

    <!-- Tender Type -->
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-mb-6">
      <div class="chaingpt-card">
        <p class="chaingpt-stat-label">Type</p>
        <p class="chaingpt-text" style="font-weight: 500;">{tenderQuery.data.tenderType}</p>
      </div>
      <div class="chaingpt-card">
        <p class="chaingpt-stat-label">Procurement Type</p>
        <p class="chaingpt-text" style="font-weight: 500;">{tenderQuery.data.procurementType}</p>
      </div>
    </div>

    <!-- Status & Visibility -->
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-mb-6">
      <div class="chaingpt-card">
        <p class="chaingpt-stat-label">Status</p>
        <span class="chaingpt-badge {getStatusBadgeClass(tenderQuery.data.status)}">
          {tenderQuery.data.status.replace('_', ' ')}
        </span>
      </div>
      <div class="chaingpt-card">
        <p class="chaingpt-stat-label">Visibility</p>
        <p class="chaingpt-text" style="font-weight: 500;">{tenderQuery.data.visibility}</p>
      </div>
    </div>

    <!-- Budget -->
    {#if tenderQuery.data.budget}
      <div class="chaingpt-card">
        <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center">
          <span class="chaingpt-stat-label">Budget</span>
          <span class="chaingpt-stat-number" style="color: var(--info);">{formatCurrency(tenderQuery.data.budget)}</span>
        </div>
      </div>
    {/if}

    <!-- Currency & Price Basis -->
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-mb-6">
      <div class="chaingpt-card">
        <p class="chaingpt-stat-label">Currency</p>
        <p class="chaingpt-text" style="font-weight: 500;">{tenderQuery.data.currency}</p>
      </div>
      <div class="chaingpt-card">
        <p class="chaingpt-stat-label">Price Basis</p>
        <p class="chaingpt-text" style="font-weight: 500;">{tenderQuery.data.priceBasis === 'unit_rate' ? 'Unit Rate' : 'Lump Sum'}</p>
      </div>
    </div>

    <!-- Important Dates -->
    <div class="chaingpt-card chaingpt-mb-6">
      <h2 class="chaingpt-title" style="font-size: 1.25rem; margin-bottom: 1rem;">Important Dates</h2>
      <div class="chaingpt-grid chaingpt-grid-2">
        <div>
          <p class="chaingpt-text-muted">Submission Deadline</p>
          <p class="chaingpt-text" style="font-weight: 500;">
            {formatDate(tenderQuery.data.submissionDeadline)}
            {#if isDeadlineSoon(tenderQuery.data.submissionDeadline)}
              <span class="chaingpt-badge chaingpt-badge-warning">Deadline Soon!</span>
            {/if}
          </p>
        </div>
        <div>
          <p class="chaingpt-text-muted">Bid Opening Time</p>
          <p class="chaingpt-text" style="font-weight: 500;">
            {tenderQuery.data.bidOpeningTime ? formatDate(tenderQuery.data.bidOpeningTime) : 'Not set'}
          </p>
        </div>
      </div>
      {#if tenderQuery.data.preBidMeetingDate}
        <div>
          <p class="chaingpt-text-muted">Pre-Bid Meeting Date</p>
          <p class="chaingpt-text" style="font-weight: 500;">
            {formatDate(tenderQuery.data.preBidMeetingDate)}
          </p>
        </div>
      {/if}
    </div>

    <!-- Security Information -->
    {#if tenderQuery.data.bidSecurityAmount || tenderQuery.data.twoEnvelopeSystem}
      <div class="chaingpt-card chaingpt-mb-6">
        <h2 class="chaingpt-title" style="font-size: 1.25rem; margin-bottom: 1rem;">Security Information</h2>
        <div class="chaingpt-grid chaingpt-grid-2">
          {#if tenderQuery.data.bidSecurityAmount}
            <div>
              <p class="chaingpt-text-muted">Bid Security Amount</p>
              <p class="chaingpt-text" style="font-weight: 500;">{formatCurrency(tenderQuery.data.bidSecurityAmount)}</p>
            </div>
          {/if}
          {#if tenderQuery.data.fundAllocation}
            <div>
              <p class="chaingpt-text-muted">Fund Allocation</p>
              <p class="chaingpt-text" style="font-weight: 500;">{formatCurrency(tenderQuery.data.fundAllocation)}</p>
            </div>
          {/if}
          <div>
            <p class="chaingpt-text-muted">Two-Envelope System</p>
            <p class="chaingpt-text" style="font-weight: 500;">
              {tenderQuery.data.twoEnvelopeSystem ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p class="chaingpt-text-muted">Validity Period</p>
            <p class="chaingpt-text" style="font-weight: 500;">{tenderQuery.data.validityDays} days</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Description -->
    {#if tenderQuery.data.description}
      <div class="chaingpt-card chaingpt-mb-6">
        <h2 class="chaingpt-title" style="font-size: 1.25rem; margin-bottom: 1rem;">Description</h2>
        <p class="chaingpt-text">{tenderQuery.data.description}</p>
      </div>
    {/if}

    <!-- Created At -->
    <div class="chaingpt-card">
      <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center">
        <span class="chaingpt-text-muted">Created At</span>
        <span class="chaingpt-text-muted">{formatDate(tenderQuery.data.createdAt)}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="chaingpt-flex chaingpt-gap-4">
      {#if $isBuyer && tenderQuery.data.status === 'published'}
        <a href="/tenders/{tenderQuery.data.id}/edit" class="chaingpt-btn chaingpt-btn-secondary">
          Edit Tender
        </a>
      {/if}
      <a href="/tenders" class="chaingpt-btn chaingpt-btn-outline">
        Back to Tenders
      </a>
    </div>
  {/if}
</div>
