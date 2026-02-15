<script lang="ts">
  import { goto } from '$app/navigation';
  import { writable } from 'svelte/store';
  import { api } from '$lib/utils/api';
  import { isBuyer } from '$lib/stores/auth';
  import TenderTypeInfo from '$lib/components/TenderTypeInfo.svelte';
  import ValueValidator from '$lib/components/ValueValidator.svelte';
  import SecurityCalculator from '$lib/components/SecurityCalculator.svelte';

  interface ValueRangesData {
    procurementType: string;
    ranges: Array<{
      label: string;
      minValue: number;
      maxValue: number | null;
      suggestedTypes: string[];
    }>;
    specialCases: Record<string, { available: boolean; type?: string }>;
  }

  interface TenderTypeDefinition {
    code: string;
    name: string;
    description?: string;
    procurement_type: string;
    min_value_bdt: number;
    max_value_bdt: number | null;
    [key: string]: unknown;
  }

  let formData = {
    title: '',
    tenderType: '' as string,
    estimatedCost: '' as string | number,
    visibility: 'open' as 'open' | 'limited',
    procurementType: '' as '' | 'goods' | 'works' | 'services',
    currency: 'BDT',
    priceBasis: 'unit_rate' as 'unit_rate' | 'lump_sum',
    fundAllocation: '' as string | number,
    bidSecurityAmount: '' as string | number,
    preBidMeetingDate: '',
    preBidMeetingLink: '',
    submissionDeadline: '',
    bidOpeningTime: '',
    validityDays: 90,
    twoEnvelopeSystem: false,
    // Special case flags
    isEmergency: false,
    isInternational: false,
    isTurnkey: false,
    isOutsourcingPersonnel: false,
    isSingleSource: false,
  };

  let isSubmitting = false;
  let errorMessage = '';
  let valueValid = false;

  // State for value ranges
  let valueRangesData = writable<ValueRangesData | null>(null);
  let valueRangesLoading = writable(false);
  let valueRangesError = writable<string | null>(null);

  // State for tender types
  let tenderTypesData = writable<TenderTypeDefinition[]>([]);
  let tenderTypesLoading = writable(false);
  let tenderTypesError = writable<string | null>(null);

  // Fetch value ranges when procurement type changes
  $: if (formData.procurementType) {
    console.log(`[DEBUG] Procurement type changed to: ${formData.procurementType}, triggering fetch`);
    fetchValueRanges(formData.procurementType);
  } else {
    console.log(`[DEBUG] Procurement type cleared, resetting value ranges`);
    valueRangesData.set(null);
  }

  // Fetch tender types when procurement type changes
  $: if (formData.procurementType) {
    fetchTenderTypes(formData.procurementType);
  } else {
    tenderTypesData.set([]);
  }

  async function fetchValueRanges(procurementType: string) {
    console.log(`[DEBUG] fetchValueRanges called for: ${procurementType}`);
    valueRangesLoading.set(true);
    valueRangesError.set(null);
    
    try {
      console.log(`[DEBUG] Making API call to /tender-types/ranges?procurementType=${procurementType}`);
      const data = await api.get<ValueRangesData>(
        `/tender-types/ranges?procurementType=${procurementType}`
      );
      
      if (!data || typeof data !== 'object') {
        throw new Error(`Invalid response structure: expected object, got ${typeof data}`);
      }
      if (!Array.isArray(data.ranges)) {
        throw new Error(`Invalid ranges: expected array, got ${typeof data.ranges}`);
      }
      
      console.log(`[TenderNewPage] Successfully fetched ${data.ranges.length} cost ranges for ${procurementType}`);
      console.log(`[DEBUG] Setting valueRangesData store with data:`, data);
      valueRangesData.set(data);
      console.log(`[DEBUG] valueRangesData store updated, current value:`, data);
    } catch (error) {
      console.error(`[TenderNewPage] Error fetching ranges for ${procurementType}:`, error);
      valueRangesError.set(error instanceof Error ? error.message : 'Failed to load cost ranges');
    } finally {
      valueRangesLoading.set(false);
      console.log(`[DEBUG] Fetch complete, loading set to false`);
    }
  }

  async function fetchTenderTypes(procurementType: string) {
    tenderTypesLoading.set(true);
    tenderTypesError.set(null);
    
    try {
      const data = await api.get<TenderTypeDefinition[] | { data: TenderTypeDefinition[] }>(
        `/tender-types?procurementType=${procurementType}`
      );
      const tenderTypes = Array.isArray(data) ? data : (data as { data: TenderTypeDefinition[] }).data || [];
      
      if (!Array.isArray(tenderTypes)) {
        throw new Error(`Invalid tender types response: expected array, got ${typeof tenderTypes}`);
      }
      
      console.log(`[TenderNewPage] Successfully fetched ${tenderTypes.length} tender types for ${procurementType}`);
      tenderTypesData.set(tenderTypes);
    } catch (error) {
      console.error(`[TenderNewPage] Error fetching tender types for ${procurementType}:`, error);
      tenderTypesError.set(error instanceof Error ? error.message : 'Failed to load tender types');
    } finally {
      tenderTypesLoading.set(false);
    }
  }

  // Build tender type dropdown options from API response
  $: currentTenderTypeOptions =
    $tenderTypesData?.map((t) => ({
      value: t.code,
      label: `${t.code} - ${t.name} (${formatRange(t.min_value_bdt, t.max_value_bdt)})`,
    })) ?? [];

  // Build estimated cost options from value ranges API
  $: currentEstimatedCostOptions = (() => {
    console.log(`[DEBUG] Computing currentEstimatedCostOptions, procurementType: ${formData.procurementType}`);
    console.log(`[DEBUG] valueRangesData value:`, $valueRangesData);
    
    if (!formData.procurementType) {
      return [{ value: '', label: 'Select procurement type first', range: null }];
    }

    if (!$valueRangesData?.ranges || $valueRangesData.ranges.length === 0) {
      console.log(`[DEBUG] No ranges data available yet`);
      return [{ value: '', label: 'Loading value ranges...', range: null }];
    }

    console.log(`[DEBUG] Building options from ${$valueRangesData.ranges.length} ranges`);
    const options = $valueRangesData.ranges.map((range) => ({
      value: String(range.minValue), // Use minValue as the dropdown value
      label: range.label,
      range: { min: range.minValue, max: range.maxValue }
    }));

    const finalOptions = [
      { value: '', label: 'Select estimated cost range...', range: null },
      ...options
    ];
    console.log(`[DEBUG] Final currentEstimatedCostOptions (${finalOptions.length} total):`, finalOptions);
    return finalOptions;
  })();

  // Filter tender types to show only those matching the selected cost
  $: filteredTenderTypeOptions = (() => {
    if (!formData.estimatedCost || !$tenderTypesData) {
      return currentTenderTypeOptions;
    }

    const cost = Number(formData.estimatedCost);

    // Check for special cases first
    if (formData.isEmergency || formData.isSingleSource) {
      if (formData.procurementType === 'goods') {
        return currentTenderTypeOptions.filter((o) => o.value === 'PG9A');
      } else if (formData.procurementType === 'services') {
        return currentTenderTypeOptions.filter((o) => o.value === 'PPS6');
      }
    }

    if (formData.isTurnkey && formData.procurementType === 'goods') {
      return currentTenderTypeOptions.filter((o) => o.value === 'PG5A');
    }

    if (formData.isInternational && formData.procurementType === 'goods') {
      return currentTenderTypeOptions.filter((o) => o.value === 'PG4');
    }

    if (
      formData.isOutsourcingPersonnel &&
      formData.procurementType === 'services'
    ) {
      return currentTenderTypeOptions.filter((o) => o.value === 'PPS2');
    }

    // Normal value-based filtering
    return currentTenderTypeOptions.filter((opt) => {
      const type = $tenderTypesData?.find((t) => t.code === opt.value);
      if (!type) return false;

      const meetsMin = cost >= type.min_value_bdt;
      const meetsMax = type.max_value_bdt === null || cost <= type.max_value_bdt;
      return meetsMin && meetsMax;
    });
  })();

  function formatRange(min: number, max: number | null): string {
    const fmt = (v: number) =>
      v >= 10000000 ? `${(v / 10000000).toFixed(0)}M+ BDT` : `${(v / 100000).toFixed(0)} Lac BDT`;
    return max ? `${fmt(min)} - ${fmt(max)}` : `${fmt(min)}+`;
  }

  // Auto-suggest tender type when cost or flags change
  // ALWAYS updates when cost/flags change to provide predictable behavior
  $: {
    // Track all dependencies explicitly to ensure reactivity
    const stateKey = `${formData.procurementType}|${formData.estimatedCost}|${formData.isEmergency}|${formData.isTurnkey}|${formData.isInternational}|${formData.isOutsourcingPersonnel}`;
    
    // Only auto-suggest if we have an estimated cost selected (avoids premature suggestion)
    if (formData.estimatedCost && filteredTenderTypeOptions.length > 0) {
      const suggestedType = filteredTenderTypeOptions[0].value;
      
      // Only update if the value actually changes (prevents infinite loops)
      if (formData.tenderType !== suggestedType) {
        formData.tenderType = suggestedType;
        console.log(`[AutoSuggest] StateKey: ${stateKey}, Suggested: ${suggestedType}, FilteredOptions: ${filteredTenderTypeOptions.length}`);
      }
    }
  }

  $: if (formData.tenderType && formData.procurementType) {
    const valid = currentTenderTypeOptions.some((o) => o.value === formData.tenderType);
    // Only clear if actually invalid (prevents infinite loops)
    if (!valid && formData.tenderType !== '') formData.tenderType = '';
  }

  $: if (formData.estimatedCost && formData.procurementType) {
    const valid = currentEstimatedCostOptions.some((o) => o.value === String(formData.estimatedCost));
    // Only clear if actually invalid (prevents infinite loops)
    if (!valid && formData.estimatedCost !== '') formData.estimatedCost = '';
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!$isBuyer) return;
    if (!formData.tenderType) {
      errorMessage = 'Please select a tender type.';
      return;
    }
    if (!valueValid) {
      errorMessage = 'Please ensure tender value is valid for selected type.';
      return;
    }

    isSubmitting = true;
    errorMessage = '';

    try {
      const body: Record<string, unknown> = {
        title: formData.title.trim(),
        tenderType: formData.tenderType,
        estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : undefined,
        twoEnvelopeSystem: formData.twoEnvelopeSystem,
        visibility: formData.visibility,
        procurementType: formData.procurementType,
        currency: formData.currency,
        priceBasis: formData.priceBasis,
        validityDays: Number(formData.validityDays) || 90,
        submissionDeadline: formData.submissionDeadline
          ? new Date(formData.submissionDeadline).toISOString()
          : undefined,
      };

      if (formData.fundAllocation && Number(formData.fundAllocation) > 0) {
        body.fundAllocation = Number(formData.fundAllocation);
      }
      if (formData.bidSecurityAmount && Number(formData.bidSecurityAmount) > 0) {
        body.bidSecurityAmount = Number(formData.bidSecurityAmount);
      }
      if (formData.preBidMeetingDate) {
        body.preBidMeetingDate = new Date(formData.preBidMeetingDate).toISOString();
      }
      if (formData.preBidMeetingLink?.trim()) {
        body.preBidMeetingLink = formData.preBidMeetingLink.trim();
      }
      if (formData.bidOpeningTime) {
        body.bidOpeningTime = new Date(formData.bidOpeningTime).toISOString();
      }

      const tender = await api.post<{ id: string }>('/tenders', body);
      goto(`/tenders/${tender.id}`);
    } catch (err: unknown) {
      errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to create tender. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleValidationChange(valid: boolean) {
    valueValid = valid;
  }
</script>

<svelte:head>
  <title>Create Tender - RFQ Buddy</title>
</svelte:head>

<div class="chaingpt-animate-fade">
  <!-- Header -->
  <div class="chaingpt-flex chaingpt-items-center chaingpt-gap-4">
    <a href="/tenders" class="chaingpt-link" aria-label="Back to tenders">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
    <h1 class="chaingpt-title">Create New Tender</h1>
  </div>

  {#if !$isBuyer}
    <div class="chaingpt-card" style="background-color: var(--color-danger-light); border: 1px solid var(--color-danger);">
      <p class="chaingpt-text" style="color: var(--color-danger);">You must be a buyer to create tenders.</p>
      <a href="/tenders" class="chaingpt-btn chaingpt-btn-secondary chaingpt-mt-4">Back to Tenders</a>
    </div>
  {:else}
    <form on:submit={handleSubmit} class="chaingpt-flex chaingpt-flex-col chaingpt-gap-6">
      {#if errorMessage}
        <div class="chaingpt-card" style="background-color: var(--color-danger-light); border: 1px solid var(--color-danger);">
          <p class="chaingpt-text" style="color: var(--color-danger);">{errorMessage}</p>
        </div>
      {/if}

      <!-- Basic Information -->
      <div class="chaingpt-card">
        <h2 class="chaingpt-title" style="font-size: 1.25rem; margin-bottom: 1.5rem;">Basic Information</h2>
        <div class="chaingpt-grid chaingpt-grid-2">
          <div class="chaingpt-col-span-2">
            <label for="title" class="chaingpt-label required">Title</label>
            <input
              id="title"
              type="text"
              bind:value={formData.title}
              class="chaingpt-input"
              placeholder="e.g., Supply of Office Equipment"
              required
              minlength="5"
              maxlength="255"
            />
            <p class="chaingpt-text-muted">Enter a descriptive title for your tender</p>
          </div>
          <div>
            <label for="procurementType" class="chaingpt-label required">Procurement Type</label>
            <select id="procurementType" bind:value={formData.procurementType} class="chaingpt-select" required>
              <option value="">Select type...</option>
              <option value="goods">Goods</option>
              <option value="works">Works</option>
              <option value="services">Services</option>
            </select>
            <p class="chaingpt-text-muted">First choose type of procurement</p>
          </div>

          <!-- Special Case Flags -->
          {#if formData.procurementType}
            <div class="chaingpt-col-span-2">
              <p class="chaingpt-label">Special Procurement Conditions</p>
              <div class="chaingpt-flex chaingpt-flex-col chaingpt-gap-3">
                <label class="chaingpt-flex chaingpt-items-center chaingpt-gap-2" style="cursor: pointer;">
                  <input
                    type="checkbox"
                    bind:checked={formData.isEmergency}
                    style="width: 1.25rem; height: 1.25rem; border: 1px solid var(--grey); cursor: pointer;"
                  />
                  <span class="chaingpt-text">Emergency / Single Source</span>
                </label>

                {#if formData.procurementType === 'goods'}
                  <label class="chaingpt-flex chaingpt-items-center chaingpt-gap-2" style="cursor: pointer;">
                    <input
                      type="checkbox"
                      bind:checked={formData.isInternational}
                      style="width: 1.25rem; height: 1.25rem; border: 1px solid var(--grey); cursor: pointer;"
                    />
                    <span class="chaingpt-text">International Bidding</span>
                  </label>

                  <label class="chaingpt-flex chaingpt-items-center chaingpt-gap-2" style="cursor: pointer;">
                    <input
                      type="checkbox"
                      bind:checked={formData.isTurnkey}
                      style="width: 1.25rem; height: 1.25rem; border: 1px solid var(--grey); cursor: pointer;"
                    />
                    <span class="chaingpt-text">Turnkey Contract (Plant & Equipment)</span>
                  </label>
                {/if}

                {#if formData.procurementType === 'services'}
                  <label class="chaingpt-flex chaingpt-items-center chaingpt-gap-2" style="cursor: pointer;">
                    <input
                      type="checkbox"
                      bind:checked={formData.isOutsourcingPersonnel}
                      style="width: 1.25rem; height: 1.25rem; border: 1px solid var(--grey); cursor: pointer;"
                    />
                    <span class="chaingpt-text">Outsourcing Service Personnel</span>
                  </label>
                {/if}
              </div>
            </div>
          {/if}

          <div>
            <label for="estimatedCost" class="chaingpt-label required">Estimated Cost (BDT)</label>
            <select
              id="estimatedCost"
              bind:value={formData.estimatedCost}
              class="chaingpt-select"
              required
              disabled={!formData.procurementType || $valueRangesLoading}
              data-value-ranges-loaded={!!($valueRangesData?.ranges?.length)}
              aria-busy={$valueRangesLoading && !!formData.procurementType}
            >
              {#if $valueRangesLoading}
                <option disabled selected>Loading value ranges...</option>
              {:else}
                <option value="">Select cost range...</option>
                {#each currentEstimatedCostOptions as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              {/if}
            </select>
            {#if formData.procurementType && $valueRangesError}
              <p class="chaingpt-text" style="color: var(--color-danger); margin-top: 0.5rem;">
                ⚠️ {$valueRangesError}
              </p>
            {/if}
            <p class="chaingpt-text-muted">2nd: Select estimated value in BDT</p>
          </div>
          <div class="chaingpt-col-span-2">
            <label for="tenderType" class="chaingpt-label required">Tender Type</label>
            <select
              id="tenderType"
              bind:value={formData.tenderType}
              class="chaingpt-select"
              required
              disabled={!formData.procurementType || !formData.estimatedCost || $tenderTypesLoading}
            >
              <option value="">
                {#if $tenderTypesLoading}
                  Loading tender types...
                {:else}
                  Select tender type...
                {/if}
              </option>
              {#each filteredTenderTypeOptions as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
            {#if formData.procurementType && $tenderTypesError}
              <p class="chaingpt-text" style="color: var(--color-danger); margin-top: 0.5rem;">
                ⚠️ {$tenderTypesError}
              </p>
            {/if}
            <p class="chaingpt-text-muted">Auto-suggested based on procurement type and estimated cost</p>
          </div>
          <div>
            <label for="visibility" class="chaingpt-label required">Visibility</label>
            <select id="visibility" bind:value={formData.visibility} class="chaingpt-select" required>
              <option value="open">Open</option>
              <option value="limited">Limited</option>
            </select>
            <p class="chaingpt-text-muted">Who can view and bid on this tender</p>
          </div>
          <div>
            <label for="currency" class="chaingpt-label required">Currency</label>
            <select id="currency" bind:value={formData.currency} class="chaingpt-select" required>
              <option value="BDT">BDT - Bangladeshi Taka</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>
          <div>
            <label for="priceBasis" class="chaingpt-label">Price Basis</label>
            <select id="priceBasis" bind:value={formData.priceBasis} class="chaingpt-select">
              <option value="unit_rate">Unit Rate</option>
              <option value="lump_sum">Lump Sum</option>
            </select>
            <p class="chaingpt-text-muted">How pricing will be calculated</p>
          </div>
          <div>
            <label for="fundAllocation" class="chaingpt-label">Fund Allocation</label>
            <input
              id="fundAllocation"
              type="number"
              bind:value={formData.fundAllocation}
              class="chaingpt-input"
              placeholder="0"
              min="0"
              step="0.01"
            />
            <p class="chaingpt-text-muted">Budget allocated for this tender</p>
          </div>
          <div>
            <label for="bidSecurityAmount" class="chaingpt-label">Bid Security Amount</label>
            <input
              id="bidSecurityAmount"
              type="number"
              bind:value={formData.bidSecurityAmount}
              class="chaingpt-input"
              placeholder="0"
              min="0"
              step="0.01"
            />
            <p class="chaingpt-text-muted">Security deposit required from bidders</p>
          </div>
          <div>
            <label for="validityDays" class="chaingpt-label">Validity (Days)</label>
            <input
              id="validityDays"
              type="number"
              bind:value={formData.validityDays}
              class="chaingpt-input"
              min="1"
              max="365"
            />
            <p class="chaingpt-text-muted">How long bids remain valid</p>
          </div>
        </div>
      </div>

      <!-- Important Dates -->
      <div class="chaingpt-card">
        <h2 class="chaingpt-title" style="font-size: 1.25rem; margin-bottom: 1.5rem;">Important Dates</h2>
        <div class="chaingpt-grid chaingpt-grid-2">
          <div>
            <label for="submissionDeadline" class="chaingpt-label required">Submission Deadline</label>
            <input
              id="submissionDeadline"
              type="datetime-local"
              bind:value={formData.submissionDeadline}
              class="chaingpt-input"
              required
            />
            <p class="chaingpt-text-muted">When bids must be submitted by</p>
          </div>
          <div>
            <label for="bidOpeningTime" class="chaingpt-label">Bid Opening Time</label>
            <input
              id="bidOpeningTime"
              type="datetime-local"
              bind:value={formData.bidOpeningTime}
              class="chaingpt-input"
            />
            <p class="chaingpt-text-muted">When bids will be opened</p>
          </div>
          <div>
            <label for="preBidMeetingDate" class="chaingpt-label">Pre-Bid Meeting Date</label>
            <input
              id="preBidMeetingDate"
              type="datetime-local"
              bind:value={formData.preBidMeetingDate}
              class="chaingpt-input"
            />
            <p class="chaingpt-text-muted">Optional meeting for bidder questions</p>
          </div>
          <div>
            <label for="preBidMeetingLink" class="chaingpt-label">Pre-Bid Meeting Link</label>
            <input
              id="preBidMeetingLink"
              type="url"
              bind:value={formData.preBidMeetingLink}
              class="chaingpt-input"
              placeholder="https://..."
            />
            <p class="chaingpt-text-muted">Virtual meeting link (if applicable)</p>
          </div>
        </div>
      </div>

      <!-- Tender Type Details -->
      {#if formData.tenderType}
        <div class="chaingpt-card">
          <h2 class="chaingpt-title" style="font-size: 1.25rem; margin-bottom: 1.5rem;">Tender Type Details</h2>
          <div class="chaingpt-flex chaingpt-flex-col chaingpt-gap-4">
            <TenderTypeInfo tenderTypeCode={formData.tenderType} />

            {#if formData.estimatedCost}
              <div class="chaingpt-pt-6" style="border-top: 1px solid var(--grey);">
                <h3 class="chaingpt-title" style="font-size: 1.125rem; margin-bottom: 1rem;">Validation & Security Info</h3>
                <div class="chaingpt-grid chaingpt-grid-2">
                  <ValueValidator
                    tenderTypeCode={formData.tenderType}
                    value={Number(formData.estimatedCost)}
                    onValidationChange={handleValidationChange}
                  />
                  <SecurityCalculator
                    tenderTypeCode={formData.tenderType}
                    tenderValue={Number(formData.estimatedCost)}
                  />
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Two-Envelope System -->
      <div class="chaingpt-card">
        <label class="chaingpt-flex chaingpt-items-center chaingpt-gap-3" style="cursor: pointer;">
          <input
            type="checkbox"
            bind:checked={formData.twoEnvelopeSystem}
            style="width: 1.25rem; height: 1.25rem; border: 1px solid var(--grey); background-color: var(--white); cursor: pointer;"
          />
          <span class="chaingpt-text">Two-Envelope System</span>
        </label>
        <p class="chaingpt-text-muted chaingpt-mt-2">Separate technical and commercial proposals for evaluation</p>
      </div>

      <!-- Submit Buttons -->
      <div class="chaingpt-flex chaingpt-gap-4">
        <button
          type="submit"
          class="chaingpt-btn chaingpt-btn-primary"
          disabled={isSubmitting || !formData.tenderType || !valueValid}
        >
          {#if isSubmitting}
            <span class="chaingpt-spinner"></span>
            Creating...
          {:else}
            Create Tender
          {/if}
        </button>
        <a href="/tenders" class="chaingpt-btn chaingpt-btn-secondary">Cancel</a>
      </div>
    </form>
  {/if}
</div>
