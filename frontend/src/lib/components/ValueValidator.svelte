<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';

  export let tenderTypeCode: string;
  export let value: number = 0;
  export let onValidationChange: (valid: boolean) => void;

  interface ValidationResult {
    valid: boolean;
    message?: string;
    suggestedType?: string;
    details?: {
      currentType: string;
      value: number;
      minAllowed: number;
      maxAllowed: number | null;
    };
  }

  const validationQuery = createQuery(() => ({
    queryKey: ['validate-value', tenderTypeCode, value],
    queryFn: async () =>
      api.post<ValidationResult>('/tender-types/validate-value', {
        value,
        tenderTypeCode,
      }),
    enabled: !!tenderTypeCode && value > 0,
  }));

  $: validation = validationQuery.data;
  $: if (validation !== undefined) {
    onValidationChange?.(validation.valid);
  }

  function formatCurrency(amount: number | null): string {
    if (amount === null) return 'Unlimited';
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Crore BDT`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)} Lac BDT`;
    return `BDT ${amount.toLocaleString('en-IN')}`;
  }
</script>

<div class="chaingpt-card">
  <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center chaingpt-mb-4">
    <h3 class="chaingpt-title" style="font-size: 1rem;">Value Validation</h3>
    {#if validationQuery.isLoading}
      <span class="chaingpt-text-muted">Checking...</span>
    {:else if validation}
      {#if validation.valid}
        <span class="chaingpt-badge chaingpt-badge-success">Valid</span>
      {:else if value > 0}
        <span class="chaingpt-badge chaingpt-badge-danger">Invalid</span>
      {/if}
    {/if}
  </div>

  {#if validationQuery.isLoading}
    <div class="chaingpt-text-muted">Validating against tender type...</div>
  {:else if validation}
    <div class="chaingpt-flex chaingpt-flex-col chaingpt-gap-4">
      <div class="chaingpt-flex chaingpt-justify-between">
        <span class="chaingpt-text-muted">Type:</span>
        <span class="chaingpt-text" style="font-weight: 500;">{tenderTypeCode}</span>
      </div>
      {#if validation.details}
        <div class="chaingpt-flex chaingpt-justify-between">
          <span class="chaingpt-text-muted">Range:</span>
          <span class="chaingpt-text" style="font-weight: 500;">
            {formatCurrency(validation.details.minAllowed)} - {formatCurrency(validation.details.maxAllowed)}
          </span>
        </div>
        <div class="chaingpt-flex chaingpt-justify-between">
          <span class="chaingpt-text-muted">Current:</span>
          <span class="chaingpt-text" style="font-weight: 500;">
            {value > 0 ? formatCurrency(value) : '-'}
          </span>
        </div>
      {/if}
    </div>

    <div class="chaingpt-divider-solid chaingpt-my-4"></div>

    {#if validation.message}
      <div class="chaingpt-text-muted" style="color: {validation.valid ? 'var(--color-success)' : 'var(--color-danger)'};">
        {validation.valid ? '✓ ' : ''}{validation.message}
      </div>
      {#if validation.suggestedType && !validation.valid}
        <p class="chaingpt-text-muted chaingpt-mt-2">Suggested type: {validation.suggestedType}</p>
      {/if}
    {/if}
  {:else if tenderTypeCode && value === 0}
    <div class="chaingpt-text-muted">Enter estimated cost to validate</div>
  {:else if !tenderTypeCode}
    <div class="chaingpt-text-muted">Select a tender type first</div>
  {/if}
</div>
