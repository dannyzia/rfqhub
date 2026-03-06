<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/utils/api';
  import { isVendor, isAuthenticated } from '$lib/stores/auth';

  interface Tender {
    id: string;
    title: string;
    description: string;
    status: string;
    submissionDeadline: string;
    estimatedValue: number;
  }

  interface BidForm {
    price: string;
    proposal: string;
    documents: File[];
  }

  let tender: Tender | null = null;
  let bidForm: BidForm = {
    price: '',
    proposal: '',
    documents: []
  };
  let isSubmitting = false;
  let errorMessage = '';
  let successMessage = '';

  $: tenderId = $page.params.id;

  async function loadTender() {
    try {
      const response = await api.get(`/tenders/${tenderId}`);
      tender = response.data;
    } catch (error) {
      errorMessage = 'Failed to load tender details';
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errorMessage = '';
    successMessage = '';
    isSubmitting = true;

    try {
      const formData = new FormData();
      formData.append('price', bidForm.price);
      formData.append('proposal', bidForm.proposal);
      
      bidForm.documents.forEach((file, index) => {
        formData.append(`documents[${index}]`, file);
      });

      await api.post(`/tenders/${tenderId}/bids`, formData);
      successMessage = 'Bid submitted successfully!';
      
      // Redirect after successful submission
      setTimeout(() => {
        goto('/tenders');
      }, 2000);
    } catch (error: unknown) {
      errorMessage = error && typeof error === 'object' && 'message' in error
        ? String((error as { message: string }).message)
        : 'Failed to submit bid. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      bidForm.documents = Array.from(target.files);
    }
  }

  loadTender();
</script>

<svelte:head>
  <title>Submit Bid - RFQ Buddy</title>
</svelte:head>

<div class="chaingpt-container" style="min-height: 100vh; padding: 2rem;">
  <div class="chaingpt-card" style="max-width: 4xl; margin: 0 auto;">
    <div class="chaingpt-flex chaingpt-items-center chaingpt-mb-6">
      <button on:click={() => goto('/tenders')} class="chaingpt-btn chaingpt-btn-ghost">
        ← Back to Tenders
      </button>
      <h1 class="chaingpt-title" style="margin: 0;">Submit Bid</h1>
    </div>

    {#if errorMessage}
      <div class="chaingpt-card" style="background-color: var(--color-danger-light); border: 1px solid var(--color-danger); margin-bottom: 1rem;">
        <p class="chaingpt-text" style="color: var(--color-danger);">{errorMessage}</p>
      </div>
    {/if}

    {#if successMessage}
      <div class="chaingpt-card" style="background-color: var(--color-success-light); border: 1px solid var(--color-success); margin-bottom: 1rem;">
        <p class="chaingpt-text" style="color: var(--color-success);">{successMessage}</p>
      </div>
    {/if}

    {#if tender}
      <div class="chaingpt-card" style="background-color: var(--color-muted-light); margin-bottom: 2rem;">
        <h2 class="chaingpt-subtitle">{tender.title}</h2>
        <p class="chaingpt-text-muted" style="margin-bottom: 1rem;">{tender.description}</p>
        <div class="chaingpt-flex chaingpt-gap-4">
          <div>
            <strong>Estimated Value:</strong> BDT {tender.estimatedValue?.toLocaleString()}
          </div>
          <div>
            <strong>Deadline:</strong> {new Date(tender.submissionDeadline).toLocaleDateString()}
          </div>
          <div>
            <strong>Status:</strong> {tender.status}
          </div>
        </div>
      </div>

      <form on:submit={handleSubmit} class="chaingpt-flex chaingpt-flex-col chaingpt-gap-6">
        <div>
          <label for="price" class="chaingpt-label required">Bid Price (BDT)</label>
          <input
            id="price"
            name="price"
            type="number"
            bind:value={bidForm.price}
            class="chaingpt-input"
            placeholder="Enter your bid price"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label for="proposal" class="chaingpt-label required">Proposal</label>
          <textarea
            id="proposal"
            name="proposal"
            bind:value={bidForm.proposal}
            class="chaingpt-input"
            placeholder="Describe your proposal, qualifications, and approach"
            rows={6}
            required
          ></textarea>
        </div>

        <div>
          <label for="documents" class="chaingpt-label">Supporting Documents</label>
          <input
            id="documents"
            name="documents"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            on:change={handleFileChange}
            class="chaingpt-input"
          />
          <p class="chaingpt-text-muted" style="margin-top: 0.5rem; font-size: 0.875rem;">
            Upload supporting documents (PDF, DOC, XLS formats)
          </p>
          {#if bidForm.documents.length > 0}
            <div class="chaingpt-flex chaingpt-flex-col chaingpt-gap-2" style="margin-top: 0.5rem;">
              {#each bidForm.documents as doc, index}
                <div class="chaingpt-flex chaingpt-items-center chaingpt-gap-2">
                  <span class="chaingpt-text" style="font-size: 0.875rem;">📄 {doc.name}</span>
                  <button
                    type="button"
                    on:click={() => bidForm.documents = bidForm.documents.filter((_, i) => i !== index)}
                    class="chaingpt-btn chaingpt-btn-ghost chaingpt-btn-sm"
                  >
                    Remove
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="chaingpt-flex chaingpt-gap-4">
          <button
            type="submit"
            class="chaingpt-btn chaingpt-btn-primary"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <span class="chaingpt-spinner"></span>
              Submitting...
            {:else}
              Submit Bid
            {/if}
          </button>
          
          <button
            type="button"
            on:click={() => goto('/tenders')}
            class="chaingpt-btn chaingpt-btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    {:else}
      <div class="chaingpt-flex chaingpt-items-center chaingpt-justify-center" style="min-height: 200px;">
        <p class="chaingpt-text-muted">Loading tender details...</p>
      </div>
    {/if}
  </div>
</div>