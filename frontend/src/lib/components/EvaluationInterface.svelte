<script lang="ts">
  import { onMount } from 'svelte';
  import type { CommitteeAssignment, Tender, Bid } from '$lib/types';
  
  export let tenderId: string;
  export let assignmentId: string;
  
  let assignment: CommitteeAssignment | null = null;
  let tender: Tender | null = null;
  let bids: Bid[] = [];
  let loading = false;
  let error: string | null = null;
  let selectedBid: Bid | null = null;
  let evaluationData: any = {};
  let saving = false;
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    error = null;
    
    try {
      // Load assignment details
      const assignmentsResponse = await fetch('/api/committee/my-assignments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!assignmentsResponse.ok) throw new Error('Failed to load assignments');
      const assignmentsData = await assignmentsResponse.json();
      assignment = assignmentsData.data.find((a: CommitteeAssignment) => a.id === assignmentId);
      
      if (!assignment) throw new Error('Assignment not found');
      
      // Load tender details
      const tenderResponse = await fetch(`/api/tenders/${tenderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!tenderResponse.ok) throw new Error('Failed to load tender');
      tender = await tenderResponse.json();
      
      // Load bids for this tender
      const bidsResponse = await fetch(`/api/tenders/${tenderId}/bids`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!bidsResponse.ok) throw new Error('Failed to load bids');
      const bidsData = await bidsResponse.json();
      bids = bidsData.data;
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  }
  
  async function saveEvaluation() {
    if (!selectedBid || !assignment) return;
    
    saving = true;
    error = null;
    
    try {
      const response = await fetch(`/api/tenders/${tenderId}/bids/${selectedBid.id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          technical_score: evaluationData.technicalScore || 0,
          line_scores: evaluationData.lineScores || [],
          remarks: evaluationData.remarks || ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save evaluation');
      }
      
      // Update assignment status to approved
      await fetch(`/api/committee/assignments/${assignment.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: 'approved' })
      });
      
      // Show success message
      alert('Evaluation saved successfully!');
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save evaluation';
    } finally {
      saving = false;
    }
  }
  
  function getTierFields() {
    if (!assignment) return [];
    
    switch (assignment.tier) {
      case 'pre_qualification':
        return [
          { key: 'vendorCompliance', label: 'Vendor Compliance', type: 'checkbox' },
          { key: 'documentCompleteness', label: 'Document Completeness', type: 'rating' },
          { key: 'financialStability', label: 'Financial Stability', type: 'rating' },
          { key: 'experienceLevel', label: 'Experience Level', type: 'rating' },
          { key: 'technicalCapability', label: 'Technical Capability', type: 'rating' }
        ];
      
      case 'technical':
        return [
          { key: 'specificationCompliance', label: 'Specification Compliance', type: 'rating' },
          { key: 'qualityStandards', label: 'Quality Standards', type: 'rating' },
          { key: 'technicalApproach', label: 'Technical Approach', type: 'rating' },
          { key: 'innovationScore', label: 'Innovation Score', type: 'rating' },
          { key: 'riskAssessment', label: 'Risk Assessment', type: 'rating' }
        ];
      
      case 'commercial':
        return [
          { key: 'priceCompetitiveness', label: 'Price Competitiveness', type: 'rating' },
          { key: 'paymentTerms', label: 'Payment Terms', type: 'rating' },
          { key: 'deliveryTimeline', label: 'Delivery Timeline', type: 'rating' },
          { key: 'warrantyTerms', label: 'Warranty Terms', type: 'rating' },
          { key: 'overallValue', label: 'Overall Value', type: 'rating' }
        ];
      
      default:
        return [];
    }
  }
  
  function getTierLabel() {
    if (!assignment) return '';
    
    switch (assignment.tier) {
      case 'pre_qualification': return 'Pre-Qualification Evaluation';
      case 'technical': return 'Technical Evaluation';
      case 'commercial': return 'Commercial Evaluation';
      default: return 'Evaluation';
    }
  }
  
  function getTierDescription() {
    if (!assignment) return '';
    
    switch (assignment.tier) {
      case 'pre_qualification':
        return 'Evaluate vendor eligibility, compliance, and basic qualifications';
      case 'technical':
        return 'Assess technical specifications, quality, and approach';
      case 'commercial':
        return 'Review pricing, terms, and commercial viability';
      default:
        return 'Complete the evaluation assessment';
    }
  }
</script>

<div class="evaluation-interface">
  <div class="mb-6">
    <nav class="flex" aria-label="Breadcrumb">
      <ol class="flex items-center space-x-2">
        <li>
          <a href="/evaluator/dashboard" class="text-gray-500 hover:text-gray-700">Dashboard</a>
        </li>
        <li>
          <span class="text-gray-500">/</span>
        </li>
        <li>
          <span class="text-gray-900 font-medium">{getTierLabel()}</span>
        </li>
      </ol>
    </nav>
    
    <h1 class="text-2xl font-bold text-gray-900 mt-2">{getTierLabel()}</h1>
    <p class="text-gray-600">{getTierDescription()}</p>
    
    {#if tender}
      <p class="text-sm text-gray-500 mt-1">Tender: {tender.title} ({tender.tender_number})</p>
    {/if}
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
  
  {#if loading}
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- Bid Selection -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Select Bid to Evaluate</h2>
      
      {#if bids.length === 0}
        <div class="text-center py-4 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No bids found</h3>
          <p class="mt-1 text-sm text-gray-500">No bids have been submitted for this tender yet.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each bids as bid}
            <div 
              class="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 {selectedBid?.id === bid.id ? 'border-blue-500 bg-blue-50' : ''}"
              on:click={() => selectedBid = bid}
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-gray-900">Bid #{bid.id.slice(0, 8)}</h3>
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {bid.status}
                </span>
              </div>
              <div class="text-sm text-gray-600">
                <p>Vendor: {bid.vendor_name}</p>
                <p>Submitted: {new Date(bid.submitted_at).toLocaleDateString()}</p>
                <p>Total Amount: ${bid.total_amount?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Evaluation Form -->
    {#if selectedBid}
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Evaluate: {selectedBid.vendor_name} - Bid #{selectedBid.id.slice(0, 8)}
        </h2>
        
        <!-- Overall Score -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Overall Technical Score (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            bind:value={evaluationData.technicalScore}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter overall score"
          />
        </div>
        
        <!-- Tier-Specific Fields -->
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-900 mb-3">Evaluation Criteria</h3>
          <div class="space-y-4">
            {#each getTierFields() as field}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                
                {#if field.type === 'checkbox'}
                  <div class="space-y-2">
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        bind:group={evaluationData[field.key]}
                        value="compliant"
                        class="mr-2"
                      />
                      <span class="text-sm text-gray-700">Compliant</span>
                    </label>
                  </div>
                {:else if field.type === 'rating'}
                  <div class="flex items-center space-x-2">
                    {#each [1, 2, 3, 4, 5] as rating}
                      <label class="flex items-center">
                        <input
                          type="radio"
                          bind:group={evaluationData[field.key]}
                          value={rating}
                          class="mr-1"
                        />
                        <span class="text-sm">{rating}</span>
                      </label>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Remarks -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Evaluation Remarks
          </label>
          <textarea
            bind:value={evaluationData.remarks}
            rows={4}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your evaluation remarks..."
          ></textarea>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3">
          <button
            on:click={() => selectedBid = null}
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            on:click={saveEvaluation}
            disabled={saving}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Evaluation'}
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
