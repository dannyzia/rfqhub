<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import TenderNewPage from './+page.svelte';
  import type { QueryClient } from '@tanstack/query-core';

  interface Props {
    queryClient: QueryClient;
  }
  let { queryClient }: Props = $props();
</script>

<QueryClientProvider client={queryClient}>
  <TenderNewPage />
</QueryClientProvider>
