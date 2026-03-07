<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { TenderTypeDefinition } from '$lib/types/tender.types';
  
  export let tenderType: string = '';
  
  let tenderTypes: TenderTypeDefinition[] = [];
  let currentSegment = 1;
  let formData: any = {};
  let loading = false;
  let error: string | null = null;
  let validation: any = { canCreate: true };
  let selectedTenderType: TenderTypeDefinition | null = null;
  
  const segments = [
    { id: 'S1', title: 'Basic Information', description: 'Tender title, description, and basic details' },
    { id: 'S2', title: 'Scope & Requirements', description: 'Detailed scope and technical requirements' },
    { id: 'S3', title: 'Timeline & Delivery', description: 'Submission deadlines and delivery schedule' },
    { id: 'S4', title: 'Evaluation Criteria', description: 'Technical and commercial evaluation criteria' },
    { id: 'S5', title: 'Technical Specifications', description: 'Detailed technical specifications' },
    { id: 'S6', title: 'Commercial Terms', description: 'Payment terms and commercial conditions' },
    { id: 'S7', title: 'Documents', description: 'Required documents and attachments' },
    { id: 'S8', title: 'Tender Security', description: 'Bid security and guarantee requirements' },
    { id: 'S9', title: 'Pre-Qualification', description: 'Vendor pre-qualification requirements' },
    { id: 'S10', title: 'Technical Evaluation', description: 'Technical evaluation methodology' },
    { id: 'S11', title: 'Commercial Evaluation', description: 'Commercial evaluation criteria' },
    { id: 'S12', title: 'Audit Requirements', description: 'Audit and compliance requirements' },
    { id: 'S13', title: 'Procurement Approval', description: 'Internal approval process' },
    { id: 'S14', title: 'Award Decision', description: 'Award criteria and decision process' }
  ];
  
  onMount(async () => {
    await loadTenderTypes();
    if (tenderType) {
      await selectTenderType(tenderType);
    }
  });
  
  async function loadTenderTypes() {
    try {
      const response = await fetch('/api/enhanced-tenders/types');
      if (!response.ok) throw new Error('Failed to load tender types');
      const data = await response.json();
      tenderTypes = data.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load tender types';
    }
  }
  
  async function selectTenderType(typeCode: string) {
    selectedTenderType = tenderTypes.find(t => t.code === typeCode) || null;
    if (selectedTenderType) {
      await validateCreation();
    }
  }
  
  async function validateCreation() {
    if (!selectedTenderType) return;
    
    try {
      const response = await fetch(`/api/enhanced-tenders/validate?tenderType=${selectedTenderType.is_govt_type ? 'detailed_tender' : 'simple_rfq'}`);
      if (!response.ok) throw new Error('Failed to validate creation');
      const data = await response.json();
      validation = data.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Validation failed';
    }
  }
  
  async function nextSegment() {
    // Validate current segment before proceeding
    if (!validateCurrentSegment()) return;
    
    if (currentSegment < segments.length) {
      currentSegment++;
    }
  }
  
  async function previousSegment() {
    if (currentSegment > 1) {
      currentSegment--;
    }
  }
  
  function validateCurrentSegment(): boolean {
    const segment = segments[currentSegment - 1];
    
    switch (segment.id) {
      case 'S1':
        return formData.title && formData.description && formData.procurement_type;
      case 'S2':
        return formData.scope && formData.requirements;
      case 'S3':
        return formData.submission_deadline && formData.bid_opening_time;
      case 'S4':
        return formData.evaluation_criteria;
      case 'S5':
        return formData.technical_specs;
      case 'S6':
        return formData.payment_terms;
      case 'S7':
        return true; // Documents are optional
      case 'S8':
        return selectedTenderType?.is_govt_type ? formData.bid_security : true;
      default:
        return true;
    }
  }
  
  async function submitTender() {
    if (!validateCurrentSegment()) {
      error = 'Please complete all required fields';
      return;
    }
    
    loading = true;
    error = null;
    
    try {
      const tenderData = {
        ...formData,
        tender_type: selectedTenderType?.code,
        is_simple_rfq: !selectedTenderType?.is_govt_type,
        is_live_tendering: formData.is_live_tendering || false,
        procurement_type: formData.procurement_type,
        currency: formData.currency || 'BDT',
        price_basis: formData.price_basis || 'unit_rate'
      };
      
      const response = await fetch('/api/enhanced-tenders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(tenderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create tender');
      }
      
      const result = await response.json();
      
      // Navigate to tender details
      goto(`/tenders/${result.data.id}`);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create tender';
    } finally {
      loading = false;
    }
  }
  
  function getSegmentProgress(): number {
    if (!selectedTenderType) return 0;
    const totalSegments = selectedTenderType.form_segment_config.segments.length;
    return (currentSegment / totalSegments) * 100;
  }
  
  function isSegmentActive(segmentId: string): boolean {
    if (!selectedTenderType) return false;
    return selectedTenderType.form_segment_config.segments.includes(segmentId);
  }
  
  function isSegmentRequired(segmentId: string): boolean {
    if (!selectedTenderType) return false;
    const conditional = selectedTenderType.form_segment_config.conditional;
    if (conditional && conditional[segmentId]) {
      return formData[conditional[segmentId]] === true;
    }
    return true;
  }
</script>

<div class="segmented-tender-creation">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Create Tender</h1>
    <p class="text-gray-600">Complete the segmented form to create a new tender</p>
  </div>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">{error}</div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Tender Type Selection -->
  <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Select Tender Type</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each tenderTypes as tenderType}
        <div 
          class="border rounded-lg p-4 cursor-pointer transition-colors {
            selectedTenderType?.code === tenderType.code 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => selectTenderType(tenderType.code)}
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-gray-900">{tenderType.name}</h3>
            {#if tenderType.is_govt_type}
              <span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                Government
              </span>
            {/if}
          </div>
          <p class="text-sm text-gray-600">Method: {tenderType.method}</p>
          <div class="mt-2">
            <div class="text-xs text-gray-500">
              Segments: {tenderType.form_segment_config.segments.length}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  {#if selectedTenderType}
    <!-- Progress Bar -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-semibold text-gray-900">Progress</h2>
        <span class="text-sm text-gray-600">{currentSegment} / {selectedTenderType.form_segment_config.segments.length}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style="width: {getSegmentProgress()}%"
        ></div>
      </div>
    </div>
    
    <!-- Segment Navigation -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between">
        <button
          on:click={previousSegment}
          disabled={currentSegment === 1}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div class="flex space-x-2">
          {#each segments as segment, index}
            <button
              class="px-3 py-1 text-sm rounded-full {
                index + 1 === currentSegment 
                  ? 'bg-blue-600 text-white' 
                  : isSegmentActive(segment.id)
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-500'
              }"
              on:click={() => currentSegment = index + 1}
              disabled={!isSegmentActive(segment.id)}
            >
              {segment.id}
            </button>
          {/each}
        </div>
        
        <button
          on:click={nextSegment}
          disabled={currentSegment === selectedTenderType.form_segment_config.segments.length}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentSegment === selectedTenderType.form_segment_config.segments.length ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
    
    <!-- Current Segment Form -->
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        {segments[currentSegment - 1].title}
      </h2>
      <p class="text-gray-600 mb-6">{segments[currentSegment - 1].description}</p>
      
      {#if currentSegment === 1}
        <!-- S1: Basic Information -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tender Title *</label>
            <input
              type="text"
              bind:value={formData.title}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tender title"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              bind:value={formData.description}
              rows={4}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tender description"
            ></textarea>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Procurement Type *</label>
              <select
                bind:value={formData.procurement_type}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select procurement type</option>
                <option value="goods">Goods</option>
                <option value="works">Works</option>
                <option value="services">Services</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                bind:value={formData.currency}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BDT">BDT - Bangladeshi Taka</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>
      {:else if currentSegment === 2}
        <!-- S2: Scope & Requirements -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Scope of Work *</label>
            <textarea
              bind:value={formData.scope}
              rows={3}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the scope of work"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Technical Requirements *</label>
            <textarea
              bind:value={formData.requirements}
              rows={4}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List technical requirements"
            ></textarea>
          </div>
        </div>
      {:else if currentSegment === 3}
        <!-- S3: Timeline & Delivery -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Submission Deadline *</label>
              <input
                type="datetime-local"
                bind:value={formData.submission_deadline}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bid Opening Time *</label>
              <input
                type="datetime-local"
                bind:value={formData.bid_opening_time}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Delivery Schedule</label>
            <textarea
              bind:value={formData.delivery_schedule}
              rows={3}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe delivery timeline"
            ></textarea>
          </div>
        </div>
      {:else if currentSegment === 4}
        <!-- S4: Evaluation Criteria -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Evaluation Criteria *</label>
            <textarea
              bind:value={formData.evaluation_criteria}
              rows={4}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe evaluation criteria and weightings"
            ></textarea>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Price Basis</label>
              <select
                bind:value={formData.price_basis}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unit_rate">Unit Rate</option>
                <option value="lump_sum">Lump Sum</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Evaluation Method</label>
              <select
                bind:value={formData.evaluation_method}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lowest_price">Lowest Price</option>
                <option value="qcbs">Quality and Cost Based Selection</option>
                <option value="technical">Technical Evaluation</option>
              </select>
            </div>
          </div>
        </div>
      {:else if currentSegment === 5}
        <!-- S5: Technical Specifications -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Technical Specifications *</label>
            <textarea
              bind:value={formData.technical_specs}
              rows={6}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed technical specifications"
            ></textarea>
          </div>
        </div>
      {:else if currentSegment === 6}
        <!-- S6: Commercial Terms -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Terms *</label>
            <select
              bind:value={formData.payment_terms}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="advance">Advance Payment</option>
              <option value="on_delivery">On Delivery</option>
              <option value="after_acceptance">After Acceptance</option>
            </select>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Budget (Optional)</label>
              <input
                type="number"
                bind:value={formData.budget}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter budget amount"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Validity Days</label>
              <input
                type="number"
                bind:value={formData.validity_days}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter validity period"
              />
            </div>
          </div>
        </div>
      {:else if currentSegment === 7}
        <!-- S7: Documents -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Required Documents</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:group={formData.required_docs}
                  value="technical_specifications"
                  class="mr-2"
                />
                <span class="text-sm text-gray-700">Technical Specifications</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:group={formData.required_docs}
                  value="financial_statements"
                  class="mr-2"
                />
                <span class="text-sm text-gray-700">Financial Statements</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:group={formData.required_docs}
                  value="experience_certificates"
                  class="mr-2"
                />
                <span class="text-sm text-gray-700">Experience Certificates</span>
              </label>
            </div>
          </div>
        </div>
      {:else if currentSegment === 8 && selectedTenderType.is_govt_type}
        <!-- S8: Tender Security -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bid Security Required</label>
              <select
                bind:value={formData.bid_security_type}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">No Security Required</option>
                <option value="bank_guarantee">Bank Guarantee</option>
                <option value="pay_order">Pay Order</option>
                <option value="demand_draft">Demand Draft</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Security Amount</label>
              <input
                type="number"
                bind:value={formData.bid_security_amount}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter security amount"
              />
            </div>
          </div>
        </div>
      {:else if currentSegment >= 9}
        <!-- S9-S14: Advanced Segments -->
        <div class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-900">{segments[currentSegment - 1].title}</h3>
            <p class="text-sm text-blue-700 mt-1">{segments[currentSegment - 1].description}</p>
            <div class="mt-3">
              <textarea
                bind:value={formData[`segment_${segments[currentSegment - 1].id}`]}
                rows={4}
                class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter details for ${segments[currentSegment - 1].title}`}
              ></textarea>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Action Buttons -->
      <div class="mt-8 flex justify-end space-x-3">
        <button
          on:click={() => goto('/tenders')}
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        
        {#if currentSegment === selectedTenderType.form_segment_config.segments.length}
          <button
            on:click={submitTender}
            disabled={loading || !validation.canCreate}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Tender'}
          </button>
        {:else}
          <button
            on:click={nextSegment}
            disabled={!validateCurrentSegment()}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Segment
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
