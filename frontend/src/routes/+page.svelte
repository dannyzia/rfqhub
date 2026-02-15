<script lang="ts">
    import { goto } from "$app/navigation";
</script>

<svelte:head>
    <title>RFQ Buddy - Online RFQ & Tendering Platform</title>
</svelte:head>

<div class="chaingpt-body">
    <!-- Body lines background -->
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

    <!-- Header -->
    <header class="chaingpt-nav sticky top-0 z-40 relative">
        <div class="chaingpt-container">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <h1 class="text-2xl font-bold" style="color: var(--orange);">
                        RFQ Buddy
                    </h1>
                </div>
                <div class="flex gap-4">
                    <a href="/login" class="chaingpt-btn chaingpt-btn-secondary"> Sign In </a>
                    <a href="/register" class="chaingpt-btn chaingpt-btn-primary">
                        Get Started
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="chaingpt-container py-20 relative z-10">
        <div class="text-center">
            <h2 class="text-5xl font-normal mb-6" style="color: var(--dark); font-family: var(--font-mono);">
                Streamline Your Procurement Process
            </h2>
            <p class="text-xl mb-8 max-w-3xl mx-auto" style="color: var(--text-secondary);">
                A comprehensive platform for managing Requests for Quotation
                (RFQ) and formal Tenders. Connect buyers with vendors through
                structured, transparent bidding.
            </p>
            <div class="flex justify-center gap-4">
                <button
                    onclick={() => goto("/register")}
                    class="chaingpt-btn chaingpt-btn-primary text-lg px-8 py-4"
                >
                    Start Free Trial
                </button>
                <button
                    onclick={() => goto("/login")}
                    class="chaingpt-btn chaingpt-btn-secondary text-lg px-8 py-4"
                >
                    Sign In
                </button>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="chaingpt-container py-16 relative z-10">
        <h3 class="text-3xl font-normal text-center mb-12" style="color: var(--dark); font-family: var(--font-mono);">
            Key Features
        </h3>

        <div class="chaingpt-grid chaingpt-grid-3">
            <!-- Feature 1 -->
            <div class="chaingpt-card chaingpt-card-hover">
                <div
                    class="w-12 h-12 flex items-center justify-center mb-4 chaingpt-clip-sm"
                    style="background-color: rgba(255, 113, 32, 0.2);"
                >
                    <svg
                        class="w-6 h-6"
                        style="color: var(--orange);"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h4 class="text-xl font-medium mb-2" style="color: var(--dark);">
                    Tender Management
                </h4>
                <p style="color: var(--text-secondary);">
                    Create, publish, and manage RFQs and Tenders with ease. Full
                    lifecycle management from creation to award.
                </p>
            </div>

            <!-- Feature 2 -->
            <div class="chaingpt-card chaingpt-card-hover">
                <div
                    class="w-12 h-12 flex items-center justify-center mb-4 chaingpt-clip-sm"
                    style="background-color: rgba(34, 197, 94, 0.2);"
                >
                    <svg
                        class="w-6 h-6"
                        style="color: var(--success);"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                </div>
                <h4 class="text-xl font-medium mb-2" style="color: var(--dark);">
                    Vendor Management
                </h4>
                <p style="color: var(--text-secondary);">
                    Vendor registration, approval workflows, and comprehensive
                    document management system.
                </p>
            </div>

            <!-- Feature 3 -->
            <div class="chaingpt-card chaingpt-card-hover">
                <div
                    class="w-12 h-12 flex items-center justify-center mb-4 chaingpt-clip-sm"
                    style="background-color: rgba(59, 130, 246, 0.2);"
                >
                    <svg
                        class="w-6 h-6"
                        style="color: var(--info);"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                    </svg>
                </div>
                <h4 class="text-xl font-medium mb-2" style="color: var(--dark);">
                    Bid Submission
                </h4>
                <p style="color: var(--text-secondary);">
                    Structured bid submission with versioning, envelope
                    separation, and complete audit trail.
                </p>
            </div>

            <!-- Feature 4 -->
            <div class="chaingpt-card chaingpt-card-hover">
                <div
                    class="w-12 h-12 flex items-center justify-center mb-4 chaingpt-clip-sm"
                    style="background-color: rgba(139, 92, 246, 0.2);"
                >
                    <svg
                        class="w-6 h-6"
                        style="color: #8b5cf6;"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                </div>
                <h4 class="text-xl font-medium mb-2" style="color: var(--dark);">
                    Two-Stage Evaluation
                </h4>
                <p style="color: var(--text-secondary);">
                    Technical and commercial evaluation with comparison matrix
                    and scoring system.
                </p>
            </div>

            <!-- Feature 5 -->
            <div class="chaingpt-card chaingpt-card-hover">
                <div
                    class="w-12 h-12 flex items-center justify-center mb-4 chaingpt-clip-sm"
                    style="background-color: rgba(245, 158, 11, 0.2);"
                >
                    <svg
                        class="w-6 h-6"
                        style="color: var(--warning);"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                        />
                    </svg>
                </div>
                <h4 class="text-xl font-medium mb-2" style="color: var(--dark);">
                    Award Management
                </h4>
                <p style="color: var(--text-secondary);">
                    Full and partial award support with automated notifications
                    to all stakeholders.
                </p>
            </div>

            <!-- Feature 6 -->
            <div class="chaingpt-card chaingpt-card-hover">
                <div
                    class="w-12 h-12 flex items-center justify-center mb-4 chaingpt-clip-sm"
                    style="background-color: rgba(239, 68, 68, 0.2);"
                >
                    <svg
                        class="w-6 h-6"
                        style="color: var(--danger);"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                    </svg>
                </div>
                <h4 class="text-xl font-medium mb-2" style="color: var(--dark);">
                    Audit Trail
                </h4>
                <p style="color: var(--text-secondary);">
                    Complete audit logging for compliance with detailed activity
                    tracking and reporting.
                </p>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 mt-16 relative z-10" style="background-color: var(--orange);">
        <div class="chaingpt-container text-center">
            <h3 class="text-3xl font-normal mb-4" style="color: var(--dark); font-family: var(--font-mono);">
                Ready to Get Started?
            </h3>
            <p class="text-xl mb-8" style="color: var(--dark-lighter);">
                Join hundreds of organizations streamlining their procurement process
            </p>
            <button
                onclick={() => goto("/register")}
                class="chaingpt-btn chaingpt-btn-secondary text-lg px-8 py-4"
                style="background-color: var(--dark); color: var(--light); border-color: var(--dark);"
            >
                Create Free Account
            </button>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 relative z-10" style="background-color: var(--dark);">
        <div class="chaingpt-container">
            <div class="text-center">
                <p class="text-sm" style="color: var(--grey);">
                    &copy; 2025 RFQ Buddy. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
</div>
