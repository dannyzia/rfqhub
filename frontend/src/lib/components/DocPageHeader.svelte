<script lang="ts">
  // Shared header for public doc pages (FAQ, Guide). Logo + Home, FAQ, Guide, Sign In, Get Started.
</script>

<header class="chaingpt-nav sticky top-0 z-40 relative">
  <div class="chaingpt-container">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center gap-6">
        <a href="/" class="text-2xl font-bold" style="color: var(--orange);">
          RFQ Buddy
        </a>
        <nav class="hidden sm:flex items-center gap-4">
          <a href="/" class="text-sm font-medium" style="color: var(--text-secondary);">Home</a>
          <a href="/faq" class="text-sm font-medium" style="color: var(--text-secondary);">FAQ</a>
          <a href="/guide" class="text-sm font-medium" style="color: var(--text-secondary);">Guide</a>
        </nav>
      </div>
      <div class="flex gap-3">
        <a href="/login" class="chaingpt-btn chaingpt-btn-secondary text-sm py-2 px-4">Sign In</a>
        <a href="/register" class="chaingpt-btn chaingpt-btn-primary text-sm py-2 px-4">Get Started</a>
      </div>
    </div>
  </div>
</header>
