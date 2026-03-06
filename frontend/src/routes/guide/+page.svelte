<script lang="ts">
  import DocPageHeader from '$lib/components/DocPageHeader.svelte';
  import { guideSections } from '$lib/content/guide';
</script>

<svelte:head>
  <title>How to Use – RFQ Buddy</title>
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
      <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary);">How to Use RFQ Buddy</h1>
      <p class="mb-10" style="color: var(--text-muted);">
        A short guide to getting started and using the platform as a buyer or vendor.
      </p>

      <div class="space-y-10">
        {#each guideSections as section}
          <section class="chaingpt-card chaingpt-clip-sm p-6" id={section.id}>
            <h2 class="text-xl font-semibold mb-3" style="color: var(--text-primary);">{section.title}</h2>
            <p class="text-sm mb-4" style="color: var(--text-secondary); line-height: 1.6;">{section.content}</p>
            {#if section.steps && section.steps.length > 0}
              <ol class="list-decimal list-inside space-y-2 text-sm" style="color: var(--text-secondary);">
                {#each section.steps as step}
                  <li class="leading-relaxed">{step}</li>
                {/each}
              </ol>
            {/if}
          </section>
        {/each}
      </div>

      <p class="mt-10 text-sm" style="color: var(--text-muted);">
        <a href="/faq" style="color: var(--orange); text-decoration: underline;">FAQ</a> · <a href="/" style="color: var(--orange); text-decoration: underline;">Home</a>
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
