<script lang="ts">
  import DocPageHeader from '$lib/components/DocPageHeader.svelte';
  import { faqItems } from '$lib/content/faq';

  let openIndex: number | null = null;

  function toggle(index: number) {
    openIndex = openIndex === index ? null : index;
  }
</script>

<svelte:head>
  <title>FAQ – RFQ Buddy</title>
</svelte:head>

<div class="chaingpt-body">
  <div class="chaingpt-body-lines">
    <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-left"></div>
    <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-left-middle"></div>
    <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-center"></div>
    <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-right-middle"></div>
    <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-right"></div>
    <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-top"></div>
    <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-top-middle"></div>
    <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-middle"></div>
    <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-bottom-middle"></div>
    <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-bottom"></div>
  </div>

  <DocPageHeader />

  <main class="chaingpt-container py-12 relative z-10">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary);">Frequently Asked Questions</h1>
      <p class="mb-8" style="color: var(--text-muted);">
        Quick answers to common questions about RFQ Buddy.
      </p>

      <div class="space-y-2">
        {#each faqItems as item, i}
          <div class="chaingpt-card chaingpt-clip-sm overflow-hidden">
            <button
              type="button"
              class="w-full text-left px-5 py-4 flex justify-between items-center gap-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
              style="color: var(--text-primary); --tw-ring-color: var(--orange);"
              on:click={() => toggle(i)}
              aria-expanded={openIndex === i}
              aria-controls="faq-answer-{i}"
              id="faq-question-{i}"
            >
              <span class="font-medium">{item.question}</span>
              <span class="flex-shrink-0 text-lg" style="color: var(--grey);" aria-hidden="true">
                {openIndex === i ? '−' : '+'}
              </span>
            </button>
            <div
              id="faq-answer-{i}"
              class="border-t px-5 py-4"
              style="border-color: var(--grey); color: var(--text-secondary);"
              role="region"
              aria-labelledby="faq-question-{i}"
              hidden={openIndex !== i}
            >
              <p class="text-sm leading-relaxed">{item.answer}</p>
            </div>
          </div>
        {/each}
      </div>

      <p class="mt-8 text-sm" style="color: var(--text-muted);">
        <a href="/guide" style="color: var(--orange); text-decoration: underline;">How to use RFQ Buddy</a> · <a href="/" style="color: var(--orange); text-decoration: underline;">Home</a>
      </p>
    </div>
  </main>

  <footer class="py-6 mt-12 relative z-10" style="background-color: var(--dark);">
    <div class="chaingpt-container text-center">
      <p class="text-sm" style="color: var(--grey);">
        &copy; 2025 RFQ Buddy. All rights reserved. <a href="/faq" style="color: var(--grey);">FAQ</a> · <a href="/guide" style="color: var(--grey);">Guide</a>
      </p>
    </div>
  </footer>
</div>
