<script lang="ts">
  // Simple RFQ Creation Form with Tender Type Integration
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { api } from '$lib/utils/api';
  import { user } from '$lib/stores/auth';
  import { z } from 'zod';
  import { simpleRfqDataSchema } from '$lib/schemas/tenderMode.schema';
  import { OrganizationType } from '$lib/types';

  let buyerInfo = {
    name: '',
    organization: '',
    contact: '',
    email: '',
    phone: '',
    deliveryCity: ''
  };
  let rfqDetails = {
    title: '',
    rfqReference: '',
    rfqType: 'goods',
    tenderType: 'NRQ1', // NEW: Default to NRQ1
    estimatedValue: 0, // NEW: For tender type validation
    currency: 'BDT',
    issueDate: new Date().toISOString().slice(0, 10),
    submissionDeadline: '',
  };
  let items = [
    { name: '', category: '', quantity: 1, unit: '', specs: '' }
  ];
  let commercial = {
    expectedDeliveryDate: '',
    deliveryLocation: '',
    paymentTerm: 'on_delivery',
    currency: 'BDT',
    taxIncluded: false
  };
  let attachments: File[] = [];
  let error = '';
  let isSubmitting = false;
  
  // NEW: Tender type selection state
  let availableTenderTypes: Array<{ code: string; name: string; description: string }> = [];
  let tenderTypeSuggestions: Array<{ code: string; name: string; confidence: number; reasons: string[] }> = [];
  let selectedTenderType: string = 'NRQ1';
  let isLoadingTenderTypes = false;
  let isLoadingSuggestions = false;

  // NEW: Load available tender types based on organization type
  async function loadAvailableTenderTypes() {
    if (!$user?.organizationType) return;
    
    isLoadingTenderTypes = true;
    try {
      const response = await api.get(`/tender-types?procurementType=${rfqDetails.rfqType}&organizationType=${$user.organizationType}`);
      availableTenderTypes = response.data || [];
      // Set default to first available type
      if (availableTenderTypes.length > 0) {
        selectedTenderType = availableTenderTypes[0].code;
        rfqDetails.tenderType = selectedTenderType;
      }
    } catch (err) {
      console.error('Failed to load tender types:', err);
    } finally {
      isLoadingTenderTypes = false;
    }
  }

  // NEW: Get tender type suggestions based on value and other parameters
  async function getSuggestions() {
    if (!rfqDetails.estimatedValue || !$user?.organizationType) return;
    
    isLoadingSuggestions = true;
    try {
      const response = await api.post('/tender-types/suggest', {
        procurementType: rfqDetails.rfqType,
        estimatedValue: rfqDetails.estimatedValue,
        currency: rfqDetails.currency,
        organizationType: $user.organizationType
      });
      tenderTypeSuggestions = response.data || [];
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    } finally {
      isLoadingSuggestions = false;
    }
  }

  // NEW: Handle procurement type change
  async function handleProcurementTypeChange() {
    await loadAvailableTenderTypes();
    await getSuggestions();
  }

  // NEW: Handle estimated value change
  async function handleValueChange() {
    await getSuggestions();
  }

  // NEW: Handle tender type selection
  function handleTenderTypeSelect(code: string) {
    selectedTenderType = code;
    rfqDetails.tenderType = code;
  }

  function addItem() {
    items.push({ name: '', category: '', quantity: 1, unit: '', specs: '' });
  }
  function removeItem(idx: number) {
    if (items.length > 1) items.splice(idx, 1);
  }

  async function submitRFQ() {
    error = '';
    isSubmitting = true;
    try {
      const rfqData = {
        buyerInfo: {
          name: buyerInfo.name,
          organization: buyerInfo.organization,
          contact: buyerInfo.email || buyerInfo.phone,
        },
        rfqDetails: {
          title: rfqDetails.title,
          description: '',
          rfqType: rfqDetails.rfqType,
          tenderType: rfqDetails.tenderType,
          estimatedValue: rfqDetails.estimatedValue,
          currency: rfqDetails.currency,
          items: items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            specs: i.specs
          })),
          deliveryLocation: commercial.deliveryLocation,
          deliveryDate: commercial.expectedDeliveryDate,
          paymentTerm: commercial.paymentTerm,
        }
      };
      simpleRfqDataSchema.parse(rfqData); // Validate
      await api.post('/tenders/simple-rfq', rfqData);
      goto('/dashboard');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Submission failed';
    } finally {
      isSubmitting = false;
    }
  }

  onMount(async () => {
    if ($user) {
      buyerInfo.name = $user.name;
      buyerInfo.organization = $user.organizationName || '';
      buyerInfo.email = $user.email;
    }
    rfqDetails.rfqReference = `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random()*100000).toString().padStart(5,'0')}`;
    
    // Load tender types when component mounts
    await loadAvailableTenderTypes();
  });
</script>

<div class="chaingpt-card chaingpt-mb-6">
  <h2>Simple RFQ Creation</h2>
  {#if error}
    <div class="chaingpt-alert chaingpt-alert-danger">{error}</div>
  {/if}
  <form on:submit|preventDefault={submitRFQ}>
    <h3>Buyer Information</h3>
    <input placeholder="Buyer Name" bind:value={buyerInfo.name} required />
    <input placeholder="Company/Organization" bind:value={buyerInfo.organization} required />
    <input placeholder="Email" type="email" bind:value={buyerInfo.email} required />
    <input placeholder="Phone" bind:value={buyerInfo.phone} />
    <input placeholder="Delivery City" bind:value={buyerInfo.deliveryCity} />

    <h3>RFQ Details</h3>
    <input placeholder="RFQ Title" bind:value={rfqDetails.title} required />
    <input placeholder="RFQ Reference No" bind:value={rfqDetails.rfqReference} readonly />
    
    <!-- NEW: Tender Type Selection -->
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4">
      <div>
        <label>Procurement Type</label>
        <select bind:value={rfqDetails.rfqType} on:change={handleProcurementTypeChange}>
          <option value="goods">Goods</option>
          <option value="services">Services</option>
          <option value="works">Works</option>
        </select>
      </div>
      <div>
        <label>Estimated Value ({rfqDetails.currency})</label>
        <input
          type="number"
          min="0"
          bind:value={rfqDetails.estimatedValue}
          on:input={handleValueChange}
          placeholder="Enter estimated value"
        />
      </div>
    </div>
    
    <!-- NEW: Available Tender Types -->
    <div class="chaingpt-mt-4">
      <h4>Tender Type Selection</h4>
      {#if isLoadingTenderTypes}
        <div class="chaingpt-skeleton" style="height: 20px; width: 100%;"></div>
      {:else if availableTenderTypes.length > 0}
        <div class="chaingpt-grid chaingpt-grid-3 chaingpt-gap-2">
          {#each availableTenderTypes as type}
            <label class="chaingpt-card chaingpt-card-hover chaingpt-p-3">
              <input
                type="radio"
                name="tenderType"
                value={type.code}
                checked={selectedTenderType === type.code}
                on:change={() => handleTenderTypeSelect(type.code)}
              />
              <div class="chaingpt-font-bold">{type.code}</div>
              <div class="chaingpt-text-sm chaingpt-text-muted">{type.name}</div>
              <div class="chaingpt-text-xs chaingpt-text-muted chaingpt-mt-1">{type.description}</div>
            </label>
          {/each}
        </div>
      {:else}
        <div class="chaingpt-alert chaingpt-alert-warning">No tender types available for your organization type.</div>
      {/if}
    </div>
    
    <!-- NEW: Suggestions -->
    {#if isLoadingSuggestions}
      <div class="chaingpt-mt-4">
        <div class="chaingpt-skeleton" style="height: 20px; width: 100%;"></div>
      </div>
    {:else if tenderTypeSuggestions.length > 0}
      <div class="chaingpt-mt-4">
        <h4>Suggested Tender Types</h4>
        <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-2">
          {#each tenderTypeSuggestions as suggestion}
            <div class="chaingpt-card chaingpt-p-3">
              <div class="chaingpt-flex chaingpt-justify-between">
                <span class="chaingpt-font-bold">{suggestion.code}</span>
                <span class="chaingpt-badge chaingpt-badge-success">{suggestion.confidence}%</span>
              </div>
              <div class="chaingpt-text-sm chaingpt-text-muted">{suggestion.name}</div>
              <ul class="chaingpt-list-disc chaingpt-list-inside chaingpt-text-xs chaingpt-mt-2">
                {#each suggestion.reasons as reason}
                  <li>{reason}</li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4 chaingpt-mt-4">
      <div>
        <label>Selected Tender Type</label>
        <input
          type="text"
          bind:value={rfqDetails.tenderType}
          readonly
          class="chaingpt-input"
        />
      </div>
      <div>
        <label>Currency</label>
        <input
          type="text"
          bind:value={rfqDetails.currency}
          placeholder="Currency (e.g., BDT, USD)"
        />
      </div>
    </div>
    
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4 chaingpt-mt-4">
      <div>
        <label>Issue Date</label>
        <input placeholder="Issue Date" type="date" bind:value={rfqDetails.issueDate} readonly />
      </div>
      <div>
        <label>Quote Submission Deadline</label>
        <input placeholder="Quote Submission Deadline" type="date" bind:value={rfqDetails.submissionDeadline} required />
      </div>
    </div>

    <h3>Item Details</h3>
    {#each items as item, idx}
      <div class="chaingpt-flex chaingpt-gap-2 chaingpt-mb-2">
        <input placeholder="Item Name/Description" bind:value={item.name} required />
        <input placeholder="Category" bind:value={item.category} />
        <input placeholder="Quantity" type="number" min="1" bind:value={item.quantity} required />
        <input placeholder="Unit" bind:value={item.unit} required />
        <input placeholder="Specification/Notes" bind:value={item.specs} />
        <button type="button" on:click={() => removeItem(idx)} disabled={items.length === 1}>Remove</button>
      </div>
    {/each}
    <button type="button" on:click={addItem}>Add Item</button>

    <h3>Commercial Basics</h3>
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4">
      <div>
        <label>Expected Delivery Date</label>
        <input placeholder="Expected Delivery Date" type="date" bind:value={commercial.expectedDeliveryDate} />
      </div>
      <div>
        <label>Delivery Location</label>
        <input placeholder="Delivery Location" bind:value={commercial.deliveryLocation} />
      </div>
    </div>
    
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4 chaingpt-mt-4">
      <div>
        <label>Payment Term</label>
        <select bind:value={commercial.paymentTerm}>
          <option value="on_delivery">On Delivery</option>
          <option value="advance">Advance</option>
          <option value="after_acceptance">After Acceptance</option>
        </select>
      </div>
      <div>
        <label>Currency</label>
        <input placeholder="Currency" bind:value={commercial.currency} />
      </div>
    </div>
    
    <div class="chaingpt-mt-4">
      <label><input type="checkbox" bind:checked={commercial.taxIncluded} /> Tax Included?</label>
    </div>

    <h3>Attachments</h3>
    <input type="file" multiple on:change={e => attachments = Array.from(e.target.files)} />

    <div class="chaingpt-mt-6">
      <button type="submit" class="chaingpt-btn chaingpt-btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit RFQ'}
      </button>
    </div>
  </form>
</div>
