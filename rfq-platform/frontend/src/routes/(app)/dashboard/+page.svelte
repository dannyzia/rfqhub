<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';
  import { user, isBuyer, isVendor } from '$lib/stores/auth';

  interface DashboardStats {
    totalTenders: number;
    activeTenders: number;
    pendingBids: number;
    submittedBids: number;
    awardedTenders: number;
  }

  interface RecentTender {
    id: string;
    tenderNumber: string;
    title: string;
    status: string;
    submissionDeadline: string;
  }

  const statsQuery = createQuery(() => ({
    queryKey: ['dashboard-stats'],
    queryFn: async () => api.get<DashboardStats>('/dashboard/stats'),
  }));

  const recentTendersQuery = createQuery(() => ({
    queryKey: ['recent-tenders'],
    queryFn: async () => api.get<{ tenders: RecentTender[] }>('/tenders?limit=5'),
  }));

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'chaingpt-badge-info';
      case 'published': return 'chaingpt-badge-success';
      case 'closed': return 'chaingpt-badge-warning';
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
</script>

<svelte:head>
  <title>Dashboard - RFQ Buddy</title>
</svelte:head>

<div class="chaingpt-animate-fade">
  <!-- Header -->
  <div class="flex justify-between items-center chaingpt-mb-6">
    <h1 class="chaingpt-title">Dashboard</h1>
    <p class="chaingpt-subtitle">Welcome back, {$user?.name}!</p>
  </div>

  <!-- Tender Mode Selection (Multi-Tender Type) -->
  <div class="chaingpt-card chaingpt-mb-6">
    <h2 class="section-title" style="color: var(--light); margin-bottom: 1rem;">Start a New Tender</h2>
    {#if $isBuyer && $user}
      {#if $user.organizationType === 'government'}
        <!-- Government Organization: Detailed RFT, Live Tendering -->
        <div class="flex flex-wrap gap-4">
          <div class="chaingpt-card chaingpt-card-hover" style="min-width: 260px;">
            <h3>Detailed RFT</h3>
            <p class="chaingpt-text-muted">This must survive audits<br/>(govt, large projects, construction, hospital, infra)</p>
            <a href="/tenders/new" class="chaingpt-btn chaingpt-btn-primary chaingpt-mt-2">Start Detailed RFT</a>
          </div>
          <div class="chaingpt-card chaingpt-card-hover" style="min-width: 260px;">
            <h3>Live Tendering</h3>
            <p class="chaingpt-text-muted">Real‑time auction bidding<br/>(scheduled auction with dynamic pricing)</p>
            <a href="/tenders/new/live-auction" class="chaingpt-btn chaingpt-btn-secondary chaingpt-mt-2">Start Live Auction</a>
          </div>
        </div>
      {:else}
        <!-- Non-Government Organization: Simple RFQ, Live Tendering -->
        <div class="flex flex-wrap gap-4">
          <div class="chaingpt-card chaingpt-card-hover" style="min-width: 260px;">
            <h3>Simple RFQ</h3>
            <p class="chaingpt-text-muted">I just need prices<br/>(office supplies, IT gear, small services)</p>
            <a href="/tenders/new/simple-rfq" class="chaingpt-btn chaingpt-btn-primary chaingpt-mt-2">Start Simple RFQ</a>
          </div>
          <div class="chaingpt-card chaingpt-card-hover" style="min-width: 260px;">
            <h3>Live Tendering</h3>
            <p class="chaingpt-text-muted">Real‑time auction bidding<br/>(scheduled auction with dynamic pricing)</p>
            <a href="/tenders/new/live-auction" class="chaingpt-btn chaingpt-btn-secondary chaingpt-mt-2">Start Live Auction</a>
          </div>
        </div>
      {/if}
    {/if}
  </div>
  <div class="chaingpt-grid chaingpt-grid-4 chaingpt-mb-6">
    {#if statsQuery.isLoading}
      {#each Array(4) as _}
        <div class="chaingpt-card chaingpt-p-4">
          <div class="h-3 rounded w-1/2 mb-2" style="background-color: var(--dark-lighter);"></div>
          <div class="h-8 rounded w-1/4" style="background-color: var(--dark-lighter);"></div>
        </div>
      {/each}
    {:else if statsQuery.data}
      <div class="chaingpt-card chaingpt-card-hover">
        <p class="chaingpt-stat-label">Total Tenders</p>
        <p class="chaingpt-stat-number">{statsQuery.data.totalTenders || 0}</p>
      </div>
      <div class="chaingpt-card chaingpt-card-hover">
        <p class="chaingpt-stat-label">Active Tenders</p>
        <p class="chaingpt-stat-number" style="color: var(--success);">{statsQuery.data.activeTenders || 0}</p>
      </div>
      {#if $isVendor}
        <div class="chaingpt-card chaingpt-card-hover">
          <p class="chaingpt-stat-label">Pending Bids</p>
          <p class="chaingpt-stat-number" style="color: var(--warning);">{statsQuery.data.pendingBids || 0}</p>
        </div>
        <div class="chaingpt-card chaingpt-card-hover">
          <p class="chaingpt-stat-label">Submitted Bids</p>
          <p class="chaingpt-stat-number" style="color: var(--info);">{statsQuery.data.submittedBids || 0}</p>
        </div>
      {:else}
        <div class="chaingpt-card chaingpt-card-hover">
          <p class="chaingpt-stat-label">Pending Evaluation</p>
          <p class="chaingpt-stat-number" style="color: var(--warning);">{statsQuery.data.pendingBids || 0}</p>
        </div>
        <div class="chaingpt-card chaingpt-card-hover">
          <p class="chaingpt-stat-label">Awarded</p>
          <p class="chaingpt-stat-number" style="color: var(--success);">{statsQuery.data.awardedTenders || 0}</p>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Quick Actions -->
  <div class="chaingpt-card chaingpt-mb-6">
    <h2 class="section-title" style="color: var(--light); margin-bottom: 1rem;">Quick Actions</h2>
    <div class="flex flex-wrap gap-3">
      {#if $isBuyer}
        <a href="/tenders/new" class="chaingpt-btn chaingpt-btn-primary">
          Create New Tender
        </a>
        <a href="/vendors" class="chaingpt-btn chaingpt-btn-secondary">
          Manage Vendors
        </a>
      {/if}
      {#if $isVendor}
        <a href="/tenders" class="chaingpt-btn chaingpt-btn-primary">
          Browse Tenders
        </a>
        <a href="/profile" class="chaingpt-btn chaingpt-btn-secondary">
          Update Profile
        </a>
      {/if}
    </div>
  </div>

  <!-- Recent Tenders -->
  <div class="chaingpt-card">
    <div class="flex justify-between items-center chaingpt-mb-4">
      <h2 class="section-title" style="color: var(--light); margin: 0;">Recent Tenders</h2>
      <a href="/tenders" class="chaingpt-link text-sm">
        View all →
      </a>
    </div>

    {#if recentTendersQuery.isLoading}
      <div class="space-y-3">
        {#each Array(5) as _}
          <div class="flex items-center justify-between py-3" style="border-bottom: 1px solid var(--dark-lighter);">
            <div class="space-y-2">
              <div class="h-4 rounded w-48" style="background-color: var(--dark-lighter);"></div>
              <div class="h-3 rounded w-24" style="background-color: var(--dark-lighter);"></div>
            </div>
            <div class="h-6 rounded w-16" style="background-color: var(--dark-lighter);"></div>
          </div>
        {/each}
      </div>
    {:else if recentTendersQuery.data?.tenders?.length}
      <div class="chaingpt-table-container">
        <table class="chaingpt-table">
          <tbody>
            {#each recentTendersQuery.data.tenders as tender}
              <tr>
                <td>
                  <a href="/tenders/{tender.id}" class="chaingpt-link" style="font-weight: 500;">
                    {tender.title}
                  </a>
                  <p class="chaingpt-text-muted" style="font-size: 0.75rem; margin: 0;">
                    {tender.tenderNumber} • Deadline: {formatDate(tender.submissionDeadline)}
                  </p>
                </td>
                <td style="text-align: right;">
                  <span class="chaingpt-badge {getStatusBadgeClass(tender.status)}">
                    {tender.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-center py-8" style="color: var(--text-muted);">No tenders found</p>
    {/if}
  </div>
</div>
