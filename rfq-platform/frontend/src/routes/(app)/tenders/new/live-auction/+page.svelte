<script lang="ts">
  // Live Auction Creation Form
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { api } from '$lib/utils/api';
  import { user } from '$lib/stores/auth';
  import { z } from 'zod';

  let tenderData = {
    tenderId: '',
    scheduledStart: '',
    scheduledEnd: '',
    biddingType: 'open_reverse',
    settings: {
      minBidIncrement: 0,
      bidVisibility: 'hidden',
      allowBidWithdrawal: false,
      requirePrequalification: false,
      autoExtendOnLastMinute: false,
      extensionMinutes: 5
    },
    limitedVendors: [] as string[]
  };
  
  let availableTenders: Array<{ id: string; title: string; tenderNumber: string }> = [];
  let selectedTender: string = '';
  let error = '';
  let isSubmitting = false;
  let isLoadingTenders = false;

  // Load available tenders for the user
  async function loadAvailableTenders() {
    if (!$user?.orgId) return;
    
    isLoadingTenders = true;
    try {
      const response = await api.get(`/tenders?orgId=${$user.orgId}&status=published&limit=50`);
      availableTenders = response.data?.tenders || [];
      
      // Set default to first available tender
      if (availableTenders.length > 0) {
        selectedTender = availableTenders[0].id;
        tenderData.tenderId = selectedTender;
      }
    } catch (err) {
      console.error('Failed to load tenders:', err);
    } finally {
      isLoadingTenders = false;
    }
  }

  // Handle tender selection
  function handleTenderSelect(tenderId: string) {
    selectedTender = tenderId;
    tenderData.tenderId = tenderId;
  }

  // Calculate duration in minutes
  function calculateDuration(): number {
    if (!tenderData.scheduledStart || !tenderData.scheduledEnd) return 0;
    
    const start = new Date(tenderData.scheduledStart);
    const end = new Date(tenderData.scheduledEnd);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }

    // Validate form
    function validateForm(): string[] {
      const errors: string[] = [];
      
      if (!tenderData.tenderId) {
        errors.push('Please select a tender');
      }
      
      if (!tenderData.scheduledStart) {
        errors.push('Please select a start time');
      }
      
      if (!tenderData.scheduledEnd) {
        errors.push('Please select an end time');
      }
      
      if (tenderData.scheduledStart && tenderData.scheduledEnd) {
        const start = new Date(tenderData.scheduledStart);
        const end = new Date(tenderData.scheduledEnd);
        
        if (start >= end) {
          errors.push('Start time must be before end time');
        }
        
        if (start < new Date()) {
          errors.push('Start time must be in the future');
        }
        
        const duration = calculateDuration();
        if (duration < 30) {
          errors.push('Minimum auction duration is 30 minutes');
        }
        if (duration > 480) {
          errors.push('Maximum auction duration is 480 minutes (8 hours)');
        }
      }
      
      if (tenderData.biddingType === 'open_auction' && tenderData.settings.minBidIncrement <= 0) {
        errors.push('Minimum bid increment is required for open auctions');
      }
      
      return errors;
    }

    // Handle limited vendors string change
    function handleLimitedVendorsChange() {
      if (tenderData.limitedVendorsString) {
        tenderData.limitedVendors = tenderData.limitedVendorsString
          .split(',')
          .map(v => v.trim())
          .filter(v => v.length > 0);
      } else {
        tenderData.limitedVendors = [];
      }
    }

  async function submitLiveAuction() {
    error = '';
    isSubmitting = true;
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      error = validationErrors.join('. ');
      isSubmitting = false;
      return;
    }
    
    try {
      const payload = {
        tenderId: tenderData.tenderId,
        scheduledStart: tenderData.scheduledStart,
        scheduledEnd: tenderData.scheduledEnd,
        biddingType: tenderData.biddingType,
        settings: tenderData.settings,
        limitedVendors: tenderData.limitedVendors
      };
      
      await api.post('/live-tendering/sessions', payload);
      goto('/dashboard');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create live auction';
    } finally {
      isSubmitting = false;
    }
  }

  onMount(() => {
    loadAvailableTenders();
  });
</script>

<div class="chaingpt-card chaingpt-mb-6">
  <h2>Live Auction Setup</h2>
  
  {#if error}
    <div class="chaingpt-alert chaingpt-alert-danger">{error}</div>
  {/if}
  
  <form on:submit|preventDefault={submitLiveAuction}>
    <h3>Basic Configuration</h3>
    
    <!-- Select Tender -->
    <div class="chaingpt-mb-4">
      <label class="chaingpt-block chaingpt-font-medium chaingpt-mb-2">Select Tender</label>
      {#if isLoadingTenders}
        <div class="chaingpt-skeleton" style="height: 40px; width: 100%;"></div>
      {:else if availableTenders.length === 0}
        <div class="chaingpt-alert chaingpt-alert-warning">No published tenders found. Please create a tender first.</div>
      {:else}
        <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-2">
          {#each availableTenders as tender}
            <label class="chaingpt-card chaingpt-card-hover chaingpt-p-3">
              <input 
                type="radio" 
                name="tender" 
                value={tender.id}
                checked={selectedTender === tender.id}
                on:change={() => handleTenderSelect(tender.id)}
                class="chaingpt-mr-3"
              />
              <div>
                <div class="chaingpt-font-bold">{tender.title}</div>
                <div class="chaingpt-text-sm chaingpt-text-muted">{tender.tenderNumber}</div>
              </div>
            </label>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Timing Configuration -->
    <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4 chaingpt-mb-4">
      <div>
        <label class="chaingpt-block chaingpt-font-medium chaingpt-mb-2">Scheduled Start</label>
        <input 
          type="datetime-local" 
          bind:value={tenderData.scheduledStart}
          class="chaingpt-input"
        />
      </div>
      <div>
        <label class="chaingpt-block chaingpt-font-medium chaingpt-mb-2">Scheduled End</label>
        <input 
          type="datetime-local" 
          bind:value={tenderData.scheduledEnd}
          class="chaingpt-input"
        />
      </div>
    </div>
    
    <!-- Duration Display -->
    {#if tenderData.scheduledStart && tenderData.scheduledEnd}
      <div class="chaingpt-alert chaingpt-alert-info chaingpt-mb-4">
        <strong>Duration:</strong> {calculateDuration()} minutes
      </div>
    {/if}
    
    <!-- Bidding Type -->
    <div class="chaingpt-mb-4">
      <label class="chaingpt-block chaingpt-font-medium chaingpt-mb-2">Bidding Type</label>
      <div class="chaingpt-grid chaingpt-grid-3 chaingpt-gap-2">
        <label class="chaingpt-card chaingpt-card-hover chaingpt-p-3">
          <input 
            type="radio" 
            name="biddingType" 
            value="sealed"
            bind:group={tenderData.biddingType}
            class="chaingpt-mr-3"
          />
          <div>
            <div class="chaingpt-font-bold">Sealed Bids</div>
            <div class="chaingpt-text-sm chaingpt-text-muted">Bids hidden until close</div>
          </div>
        </label>
        
        <label class="chaingpt-card chaingpt-card-hover chaingpt-p-3">
          <input 
            type="radio" 
            name="biddingType" 
            value="open_reverse"
            bind:group={tenderData.biddingType}
            class="chaingpt-mr-3"
          />
          <div>
            <div class="chaingpt-font-bold">Open Reverse</div>
            <div class="chaingpt-text-sm chaingpt-text-muted">Price decreases over time</div>
          </div>
        </label>
        
        <label class="chaingpt-card chaingpt-card-hover chaingpt-p-3">
          <input 
            type="radio" 
            name="biddingType" 
            value="open_auction"
            bind:group={tenderData.biddingType}
            class="chaingpt-mr-3"
          />
          <div>
            <div class="chaingpt-font-bold">Open Auction</div>
            <div class="chaingpt-text-sm chaingpt-text-muted">Price increases with bids</div>
          </div>
        </label>
      </div>
    </div>
    
    <!-- Advanced Settings -->
    <div class="chaingpt-mb-4">
      <label class="chaingpt-block chaingpt-font-medium chaingpt-mb-2">Advanced Settings</label>
      
      <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4">
        <div>
          <label class="chaingpt-block chaingpt-text-sm chaingpt-text-muted">Minimum Bid Increment</label>
          <input 
            type="number" 
            min="0" 
            bind:value={tenderData.settings.minBidIncrement}
            class="chaingpt-input"
            placeholder="0"
          />
        </div>
        
        <div>
          <label class="chaingpt-block chaingpt-text-sm chaingpt-text-muted">Bid Visibility</label>
          <select bind:value={tenderData.settings.bidVisibility} class="chaingpt-input">
            <option value="hidden">Hidden (default)</option>
            <option value="visible">Visible to all</option>
            <option value="after_close">After close</option>
          </select>
        </div>
      </div>
      
      <div class="chaingpt-grid chaingpt-grid-3 chaingpt-gap-4 chaingpt-mt-4">
        <label class="chaingpt-flex chaingpt-items-center">
          <input 
            type="checkbox" 
            bind:checked={tenderData.settings.allowBidWithdrawal}
            class="chaingpt-mr-2"
          />
          Allow bid withdrawal
        </label>
        
        <label class="chaingpt-flex chaingpt-items-center">
          <input 
            type="checkbox" 
            bind:checked={tenderData.settings.requirePrequalification}
            class="chaingpt-mr-2"
          />
          Require prequalification
        </label>
        
        <label class="chaingpt-flex chaingpt-items-center">
          <input 
            type="checkbox" 
            bind:checked={tenderData.settings.autoExtendOnLastMinute}
            class="chaingpt-mr-2"
          />
          Auto-extend on last minute
        </label>
      </div>
      
      {#if tenderData.settings.autoExtendOnLastMinute}
        <div class="chaingpt-mt-2">
          <label class="chaingpt-block chaingpt-text-sm chaingpt-text-muted">Extension Minutes</label>
          <input 
            type="number" 
            min="1" 
            max="30" 
            bind:value={tenderData.settings.extensionMinutes}
            class="chaingpt-input"
            placeholder="5"
          />
        </div>
      {/if}
    </div>
    
    <!-- Limited Vendors -->
    <div class="chaingpt-mb-6">
      <label class="chaingpt-block chaingpt-font-medium chaingpt-mb-2">Limited Vendors (Optional)</label>
      <div class="chaingpt-text-sm chaingpt-text-muted chaingpt-mb-2">
        Leave empty for open auction. Add vendor IDs to restrict participation.
      </div>
      <input 
        type="text" 
        bind:value={tenderData.limitedVendorsString}
        on:input={handleLimitedVendorsChange}
        placeholder="vendor-id-1, vendor-id-2, vendor-id-3"
        class="chaingpt-input"
      />
      <div class="chaingpt-text-xs chaingpt-text-muted chaingpt-mt-1">
        Comma-separated vendor IDs. Only these vendors can participate.
      </div>
    </div>
    
    <!-- Submit Button -->
    <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center">
      <div class="chaingpt-text-sm chaingpt-text-muted">
        {availableTenders.length} available tenders
      </div>
      <button 
        type="submit" 
        class="chaingpt-btn chaingpt-btn-primary"
        disabled={isSubmitting || isLoadingTenders || availableTenders.length === 0}
      >
        {isSubmitting ? 'Creating Live Auction...' : 'Create Live Auction'}
      </button>
    </div>
  </form>
</div>