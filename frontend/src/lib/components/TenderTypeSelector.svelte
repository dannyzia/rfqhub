<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let procurementType: 'goods' | 'works' | 'services' = 'goods';
  export let estimatedValue: number = 0;
  export let selectedType: string = '';

  const dispatch = createEventDispatcher<{ select: { tenderType: string } }>();

  const tenderTypes = {
    PG: {
      code: 'PG',
      name: 'Procurement of Goods',
      description: 'For purchasing physical goods, equipment, materials, and supplies.',
      min: 10000000,
      max: 10000000000,
    },
    PW: {
      code: 'PW',
      name: 'Procurement of Works',
      description: 'For construction, infrastructure, engineering, and related works.',
      min: 50000000,
      max: 50000000000,
    },
    PPS: {
      code: 'PPS',
      name: 'Procurement of Services',
      description: 'For professional, technical, and consulting services.',
      min: 5000000,
      max: 5000000000,
    },
    PG_L: {
      code: 'PG_L',
      name: 'Procurement of Goods (Limited)',
      description: 'For limited procurement of goods below the PG threshold.',
      min: 1000000,
      max: 9999999,
    },
    PW_L: {
      code: 'PW_L',
      name: 'Procurement of Works (Limited)',
      description: 'For limited procurement of works below the PW threshold.',
      min: 5000000,
      max: 49999999,
    },
    PPS_L: {
      code: 'PPS_L',
      name: 'Procurement of Services (Limited)',
      description: 'For limited procurement of services below the PPS threshold.',
      min: 500000,
      max: 4999999,
    },
  };

  function getAvailableTypes() {
    const types = Object.values(tenderTypes);
    
    if (procurementType === 'goods') {
      return types.filter(t => t.code.startsWith('PG'));
    } else if (procurementType === 'works') {
      return types.filter(t => t.code.startsWith('PW'));
    } else if (procurementType === 'services') {
      return types.filter(t => t.code.startsWith('PPS'));
    }
    return types;
  }

  function getTypeClass(typeCode: string): string {
    if (selectedType === typeCode) {
      return 'chaingpt-card chaingpt-card-orange';
    }
    return 'chaingpt-card chaingpt-card-hover';
  }

  function getTypeIcon(typeCode: string): string {
    switch (typeCode.charAt(0)) {
      case 'P': return '📦';
      case 'W': return '🏗';
      case 'S': return '💼';
      default: return '📋';
    }
  }

  function selectType(typeCode: string) {
    selectedType = typeCode;
    dispatch('select', { tenderType: typeCode });
  }
</script>

<div class="chaingpt-grid chaingpt-grid-3">
  {#each getAvailableTypes() as type}
    <div 
      class="{getTypeClass(type.code)} chaingpt-p-4"
      on:click={() => selectType(type.code)}
      role="button"
      tabindex="0"
      on:keydown={(e) => e.key === 'Enter' && selectType(type.code)}
    >
      <div class="chaingpt-flex chaingpt-items-center chaingpt-justify-center chaingpt-mb-4">
        <span style="font-size: 2.5rem;">{getTypeIcon(type.code)}</span>
      </div>
      <h3 class="chaingpt-title" style="font-size: 1rem; text-align: center; margin-bottom: 0.5rem;">
        {type.code}
      </h3>
      <p class="chaingpt-subtitle" style="text-align: center; margin-bottom: 0.5rem;">
        {type.name}
      </p>
      <div class="chaingpt-text-muted" style="text-align: center; font-size: 0.75rem;">
        <p style="margin: 0;">{type.description}</p>
        <p style="margin-top: 0.5rem;">Range: {(type.min / 1000000).toFixed(1)}M - {(type.max / 1000000).toFixed(0)}M BDT</p>
      </div>
    </div>
  {/each}
</div>
