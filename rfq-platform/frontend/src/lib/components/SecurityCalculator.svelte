<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';

  export let tenderTypeCode: string;
  export let tenderValue: number = 0;

  interface SecurityCalculationResult {
    tenderTypeCode: string;
    tenderValue: number;
    bidSecurity: {
      applicable: boolean;
      percentage: number | null;
      amount: number | null;
      currency: string;
      remark?: string;
    };
    performanceSecurity: {
      applicable: boolean;
      percentage: number | null;
      amount: number | null;
      currency: string;
      remark?: string;
    };
    otherSecurities?: Array<{ name: string; percentage: number; amount: number }>;
  }

  const securitiesQuery = createQuery(() => ({
    queryKey: ['calculate-securities', tenderTypeCode, tenderValue],
    queryFn: async () =>
      api.post<SecurityCalculationResult>('/tender-types/calculate-securities', {
        tenderValue,
        tenderTypeCode,
      }),
    enabled: !!tenderTypeCode && tenderValue > 0,
  }));

  $: result = securitiesQuery.data;

  function formatCurrency(amount: number): string {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Crore BDT`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)} Lac BDT`;
    return `BDT ${amount.toLocaleString('en-IN')}`;
  }

  function getTypeIcon(typeCode: string): string {
    switch (typeCode.charAt(0)) {
      case 'P':
        return '🔒';
      case 'W':
        return '🏗';
      case 'S':
        return '💼';
      default:
        return '📋';
    }
  }

  $: totalSecurity =
    result?.bidSecurity?.amount && result?.performanceSecurity?.amount
      ? (result.bidSecurity.amount || 0) + (result.performanceSecurity.amount || 0)
      : result?.bidSecurity?.amount || result?.performanceSecurity?.amount || 0;
  $: otherTotal =
    result?.otherSecurities?.reduce((sum, s) => sum + s.amount, 0) ?? 0;
  $: grandTotal = totalSecurity + otherTotal;
</script>

<div class="chaingpt-card">
  <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center chaingpt-mb-4">
    <h3 class="chaingpt-title" style="font-size: 1rem;">Bid Security Calculator</h3>
    <div class="chaingpt-flex chaingpt-items-center chaingpt-gap-2">
      <span style="font-size: 1.5rem;">{getTypeIcon(tenderTypeCode)}</span>
      {#if tenderTypeCode}
        <span class="chaingpt-text-muted">({tenderTypeCode})</span>
      {/if}
    </div>
  </div>

  {#if securitiesQuery.isLoading}
    <div class="chaingpt-text-muted">Calculating securities...</div>
  {:else if result}
    <div class="chaingpt-flex chaingpt-flex-col chaingpt-gap-4">
      <div class="chaingpt-flex chaingpt-justify-between">
        <span class="chaingpt-text-muted">Tender Value:</span>
        <span class="chaingpt-text" style="font-weight: 500;">
          {tenderValue > 0 ? formatCurrency(tenderValue) : '-'}
        </span>
      </div>
      {#if result.bidSecurity.applicable}
        <div class="chaingpt-flex chaingpt-justify-between">
          <span class="chaingpt-text-muted">Bid Security:</span>
          <span class="chaingpt-text" style="font-weight: 500;">
            {result.bidSecurity.percentage}% = {result.bidSecurity.amount ? formatCurrency(result.bidSecurity.amount) : '-'}
          </span>
        </div>
      {/if}
      {#if result.performanceSecurity.applicable}
        <div class="chaingpt-flex chaingpt-justify-between">
          <span class="chaingpt-text-muted">Performance Security:</span>
          <span class="chaingpt-text" style="font-weight: 500;">
            {result.performanceSecurity.percentage}% = {result.performanceSecurity.amount ? formatCurrency(result.performanceSecurity.amount) : '-'}
          </span>
        </div>
      {/if}
    </div>

    <div class="chaingpt-divider-solid chaingpt-my-4"></div>

    <div class="chaingpt-card chaingpt-card-orange" style="padding: 1.5rem; text-align: center;">
      <p class="chaingpt-text-muted" style="margin-bottom: 0.5rem;">Required Bid Security</p>
      <p class="chaingpt-stat-number" style="font-size: 2rem; color: var(--dark);">
        {result.bidSecurity.amount ? formatCurrency(result.bidSecurity.amount) : '-'}
      </p>
      {#if result.bidSecurity.remark}
        <p class="chaingpt-text-muted" style="font-size: 0.75rem; margin-top: 0.5rem;">
          {result.bidSecurity.remark}
        </p>
      {:else if result.bidSecurity.percentage}
        <p class="chaingpt-text-muted" style="font-size: 0.75rem; margin-top: 0.5rem;">
          Based on {result.bidSecurity.percentage}% of tender value
        </p>
      {/if}
    </div>

    {#if result.otherSecurities?.length}
      <div class="chaingpt-mt-4">
        <p class="chaingpt-text-muted chaingpt-mb-2">Additional Securities:</p>
        {#each result.otherSecurities as sec}
          <div class="chaingpt-flex chaingpt-justify-between chaingpt-mb-1">
            <span class="chaingpt-text">{sec.name}</span>
            <span class="chaingpt-text">{sec.percentage}% = {formatCurrency(sec.amount)}</span>
          </div>
        {/each}
      </div>
    {/if}
  {:else if tenderTypeCode && tenderValue === 0}
    <div class="chaingpt-text-muted">Enter tender value to calculate security</div>
  {:else if !tenderTypeCode}
    <div class="chaingpt-text-muted">Select a tender type to calculate security amount</div>
  {/if}
</div>
