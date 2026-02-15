<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { api } from '$lib/utils/api';

  export let tenderTypeCode: string;

  interface TenderTypeDefinition {
    code: string;
    name: string;
    description?: string;
    min_value_bdt: number;
    max_value_bdt: number | null;
  }

  const typeQuery = createQuery(() => ({
    queryKey: ['tender-type', tenderTypeCode],
    queryFn: async () => api.get<TenderTypeDefinition>(`/tender-types/${tenderTypeCode}`),
    enabled: !!tenderTypeCode,
  }));

  $: typeInfo = typeQuery.data;

  function getTypeIcon(typeCode: string): string {
    switch (typeCode?.charAt(0)) {
      case 'P':
        return '📦';
      case 'W':
        return '🏗';
      case 'S':
        return '💼';
      default:
        return '📋';
    }
  }

  function formatValue(val: number | null): string {
    if (val === null) return 'Unlimited';
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Crore BDT`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)} Lac BDT`;
    return `BDT ${val.toLocaleString('en-IN')}`;
  }
</script>

{#if typeQuery.isLoading}
  <div class="chaingpt-text-muted">Loading tender type details...</div>
{:else if typeInfo}
  <div class="chaingpt-card chaingpt-p-6">
    <div class="chaingpt-flex chaingpt-items-center chaingpt-justify-center chaingpt-mb-4">
      <span style="font-size: 3rem;">{getTypeIcon(typeInfo.code)}</span>
    </div>
    <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center chaingpt-mb-4">
      <h3 class="chaingpt-title" style="font-size: 1.5rem;">{typeInfo.code}</h3>
      <span class="chaingpt-badge chaingpt-badge-orange">Selected</span>
    </div>
    <h4 class="chaingpt-subtitle" style="font-size: 1.125rem; margin-bottom: 0.5rem;">
      {typeInfo.name}
    </h4>
    {#if typeInfo.description}
      <p class="chaingpt-text" style="margin-bottom: 1rem;">
        {typeInfo.description}
      </p>
    {/if}
    <div class="chaingpt-divider-solid chaingpt-mb-4"></div>
    <div class="chaingpt-grid chaingpt-grid-2">
      <div>
        <p class="chaingpt-stat-label">Minimum Value</p>
        <p class="chaingpt-text" style="font-size: 1.25rem; font-weight: 500;">
          {formatValue(typeInfo.min_value_bdt)}
        </p>
      </div>
      <div>
        <p class="chaingpt-stat-label">Maximum Value</p>
        <p class="chaingpt-text" style="font-size: 1.25rem; font-weight: 500;">
          {formatValue(typeInfo.max_value_bdt)}
        </p>
      </div>
    </div>
  </div>
{:else if tenderTypeCode}
  <div class="chaingpt-text-muted">Tender type {tenderTypeCode} not found</div>
{/if}
