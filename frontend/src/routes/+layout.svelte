<script lang="ts">
    import "../app.css";
    import "../chaingpt-theme.css";
    import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
    import { onMount } from "svelte";
    import { authStore, initAuth } from "$lib/stores/auth";

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: 10 * 60 * 1000, // garbage collection time
                retry: (failureCount) => failureCount < 2, // retry 2 times
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
                throwOnError: false, // don't throw, let component handle errors
            },
        },
    });

    onMount(() => {
        initAuth();
    });
</script>

<QueryClientProvider client={queryClient}>
    <div class="chaingpt-body">
        <!-- Body lines background effect -->
        <div class="chaingpt-body-lines">
            <!-- Vertical lines -->
            <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-left"></div>
            <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-left-middle"></div>
            <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-center"></div>
            <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-right-middle"></div>
            <div class="chaingpt-body-line chaingpt-body-line-v chaingpt-body-line-right"></div>
            <!-- Horizontal lines -->
            <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-top"></div>
            <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-top-middle"></div>
            <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-middle"></div>
            <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-bottom-middle"></div>
            <div class="chaingpt-body-line chaingpt-body-line-h chaingpt-body-line-bottom"></div>
        </div>
        
        <!-- Main content -->
        <div class="relative z-10 min-h-screen">
            <slot />
        </div>
    </div>
</QueryClientProvider>
