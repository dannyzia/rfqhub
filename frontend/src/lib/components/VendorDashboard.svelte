<script lang="ts">
    import { onMount } from "svelte";

    interface VendorProfile {
        id: string;
        organization_id: string;
        company_name: string;
        contact_person: string;
        email: string;
        phone: string;
        address: string;
        tax_id: string;
        registration_number: string;
        status: "pending" | "approved" | "rejected";
        verification_status: "pending" | "verified" | "rejected";
        created_at: string;
        updated_at: string;
    }

    interface VendorBid {
        id: string;
        tender_id: string;
        tender_title: string;
        tender_number: string;
        status:
            | "draft"
            | "submitted"
            | "qualified"
            | "disqualified"
            | "withdrawn"
            | "awarded";
        total_amount: number;
        currency: string;
        submitted_at: string | null;
        qualification_status:
            | "pending"
            | "passed"
            | "failed"
            | "not_applicable";
    }

    interface VendorDocument {
        id: string;
        document_type: string;
        file_name: string;
        file_size: number;
        upload_date: string;
        expiry_date: string | null;
        status: "valid" | "expired" | "pending";
    }

    interface SubscriptionUsage {
        tender_limit: number;
        tender_used: number;
        bid_limit: number;
        bid_used: number;
        storage_limit_mb: number;
        storage_used_mb: number;
        live_session_limit: number;
        live_session_used: number;
    }

    let profile: VendorProfile | null = null;
    let bids: VendorBid[] = [];
    let documents: VendorDocument[] = [];
    let subscriptionUsage: SubscriptionUsage | null = null;
    let loading = false;
    let error: string | null = null;
    let selectedBidStatus = "all";
    let selectedDocStatus = "all";

    const bidStatuses = [
        { value: "all", label: "All Bids" },
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Submitted" },
        { value: "qualified", label: "Qualified" },
        { value: "disqualified", label: "Disqualified" },
        { value: "withdrawn", label: "Withdrawn" },
        { value: "awarded", label: "Awarded" },
    ] as const;

    const documentStatuses = [
        { value: "all", label: "All Documents" },
        { value: "valid", label: "Valid" },
        { value: "expired", label: "Expired" },
        { value: "pending", label: "Pending" },
    ] as const;

    onMount(async () => {
        await loadVendorData();
    });

    async function loadVendorData() {
        loading = true;
        error = null;

        try {
            // Load vendor profile
            const profileResponse = await fetch("/api/vendors/profile", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                throw new Error(
                    errorData.error?.message || "Failed to load vendor profile",
                );
            }

            const profileData = await profileResponse.json();
            profile = profileData.data;

            // Load vendor bids
            const bidsResponse = await fetch("/api/vendors/bids", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (!bidsResponse.ok) {
                const errorData = await bidsResponse.json();
                throw new Error(
                    errorData.error?.message || "Failed to load bids",
                );
            }

            const bidsData = await bidsResponse.json();
            bids = bidsData.data;

            // Load vendor documents
            const docsResponse = await fetch("/api/vendors/documents", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (!docsResponse.ok) {
                const errorData = await docsResponse.json();
                throw new Error(
                    errorData.error?.message || "Failed to load documents",
                );
            }

            const docsData = await docsResponse.json();
            documents = docsData.data;

            // Load subscription usage
            const usageResponse = await fetch("/api/subscriptions/usage", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (usageResponse.ok) {
                const usageData = await usageResponse.json();
                subscriptionUsage = usageData.data;
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
        } finally {
            loading = false;
        }
    }

    async function uploadDocument(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const formData = new FormData();
        formData.append("document", file);
        formData.append("document_type", "general");

        loading = true;
        error = null;

        try {
            const response = await fetch("/api/vendors/documents", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error?.message || "Failed to upload document",
                );
            }

            await loadVendorData();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to upload document";
        } finally {
            loading = false;
        }
    }

    async function deleteDocument(documentId: string) {
        if (!confirm("Are you sure you want to delete this document?")) return;

        loading = true;
        error = null;

        try {
            const response = await fetch(
                `/api/vendors/documents/${documentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error?.message || "Failed to delete document",
                );
            }

            await loadVendorData();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to delete document";
        } finally {
            loading = false;
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "approved":
            case "verified":
            case "qualified":
            case "awarded":
                return "bg-green-100 text-green-800";
            case "rejected":
            case "disqualified":
                return "bg-red-100 text-red-800";
            case "pending":
            case "draft":
                return "bg-yellow-100 text-yellow-800";
            case "submitted":
                return "bg-blue-100 text-blue-800";
            case "withdrawn":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }

    function getVerificationStatusColor(status: string) {
        switch (status) {
            case "verified":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    function formatCurrency(amount: number, currency: string): string {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "BDT",
        }).format(amount);
    }

    $: filteredBids = bids.filter((bid) => {
        const statusMatch =
            selectedBidStatus === "all" || bid.status === selectedBidStatus;
        return statusMatch;
    });

    $: filteredDocuments = documents.filter((doc) => {
        const statusMatch =
            selectedDocStatus === "all" || doc.status === selectedDocStatus;
        return statusMatch;
    });

    $: bidStats = bidStatuses.slice(1).reduce(
        (acc, status) => {
            acc[status.value] = bids.filter(
                (b) => b.status === status.value,
            ).length;
            return acc;
        },
        {} as Record<string, number>,
    );

    $: documentStats = documentStatuses.slice(1).reduce(
        (acc, status) => {
            acc[status.value] = documents.filter(
                (d) => d.status === status.value,
            ).length;
            return acc;
        },
        {} as Record<string, number>,
    );
</script>

<div class="vendor-dashboard">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p class="text-gray-600">Manage your profile, bids, and documents</p>
    </div>

    {#if error}
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg
                        class="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error</h3>
                    <div class="mt-2 text-sm text-red-700">{error}</div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Profile Overview -->
    {#if profile}
        <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">
                    Company Profile
                </h2>
                <span
                    class="px-3 py-1 text-sm font-medium rounded-full {getVerificationStatusColor(
                        profile.verification_status,
                    )}"
                >
                    {profile.verification_status}
                </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 class="font-medium text-gray-900">
                        {profile.company_name}
                    </h3>
                    <p class="text-sm text-gray-600">
                        {profile.contact_person}
                    </p>
                    <p class="text-sm text-gray-600">{profile.email}</p>
                    <p class="text-sm text-gray-600">{profile.phone}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">{profile.address}</p>
                    <p class="text-sm text-gray-600">
                        Tax ID: {profile.tax_id}
                    </p>
                    <p class="text-sm text-gray-600">
                        Registration: {profile.registration_number}
                    </p>
                </div>
            </div>
        </div>
    {/if}

    <!-- Subscription Usage -->
    {#if subscriptionUsage}
        <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                Subscription Usage
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">
                        {subscriptionUsage.tender_used}/{subscriptionUsage.tender_limit}
                    </div>
                    <div class="text-sm text-gray-600">Tenders</div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            class="bg-blue-600 h-2 rounded-full"
                            style="width: {(subscriptionUsage.tender_used /
                                subscriptionUsage.tender_limit) *
                                100}%"
                        ></div>
                    </div>
                </div>

                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">
                        {subscriptionUsage.bid_used}/{subscriptionUsage.bid_limit}
                    </div>
                    <div class="text-sm text-gray-600">Bids</div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            class="bg-green-600 h-2 rounded-full"
                            style="width: {(subscriptionUsage.bid_used /
                                subscriptionUsage.bid_limit) *
                                100}%"
                        ></div>
                    </div>
                </div>

                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600">
                        {subscriptionUsage.storage_used_mb}/{subscriptionUsage.storage_limit_mb}
                        MB
                    </div>
                    <div class="text-sm text-gray-600">Storage</div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            class="bg-purple-600 h-2 rounded-full"
                            style="width: {(subscriptionUsage.storage_used_mb /
                                subscriptionUsage.storage_limit_mb) *
                                100}%"
                        ></div>
                    </div>
                </div>

                <div class="text-center">
                    <div class="text-2xl font-bold text-orange-600">
                        {subscriptionUsage.live_session_used}/{subscriptionUsage.live_session_limit}
                    </div>
                    <div class="text-sm text-gray-600">Live Sessions</div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            class="bg-orange-600 h-2 rounded-full"
                            style="width: {(subscriptionUsage.live_session_used /
                                subscriptionUsage.live_session_limit) *
                                100}%"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Bid Statistics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {#each bidStatuses.slice(1) as status}
            <div
                class="bg-white border border-gray-200 rounded-lg p-4 text-center"
            >
                <div class="text-2xl font-bold text-gray-900">
                    {bidStats[status.value] || 0}
                </div>
                <div class="text-sm text-gray-600">{status.label}</div>
            </div>
        {/each}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Bids Section -->
        <div class="bg-white border border-gray-200 rounded-lg">
            <div
                class="px-4 py-3 border-b border-gray-200 flex items-center justify-between"
            >
                <h2 class="text-lg font-semibold text-gray-900">
                    My Bids ({filteredBids.length})
                </h2>
                <select
                    bind:value={selectedBidStatus}
                    aria-label="Filter by Status"
                    class="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {#each bidStatuses as status}
                        <option value={status.value}>{status.label}</option>
                    {/each}
                </select>
            </div>

            {#if loading}
                <div class="flex justify-center items-center py-8">
                    <div
                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                    ></div>
                </div>
            {:else if filteredBids.length === 0}
                <div class="text-center py-8 text-gray-500">
                    <svg
                        class="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">
                        No bids found
                    </h3>
                    <p class="mt-1 text-sm text-gray-500">
                        {selectedBidStatus !== "all"
                            ? "Try adjusting your filter"
                            : "You haven't submitted any bids yet"}
                    </p>
                </div>
            {:else}
                <div class="divide-y divide-gray-200">
                    {#each filteredBids as bid}
                        <div class="p-4 hover:bg-gray-50">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-3">
                                        <div>
                                            <h3
                                                class="text-sm font-medium text-gray-900"
                                            >
                                                {bid.tender_title}
                                            </h3>
                                            <p class="text-sm text-gray-500">
                                                {bid.tender_number}
                                            </p>
                                        </div>
                                        <span
                                            class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
                                                bid.status,
                                            )}"
                                        >
                                            {bid.status}
                                        </span>
                                        {#if bid.qualification_status !== "not_applicable"}
                                            <span
                                                class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
                                                    bid.qualification_status,
                                                )}"
                                            >
                                                {bid.qualification_status}
                                            </span>
                                        {/if}
                                    </div>

                                    <div
                                        class="mt-2 flex items-center space-x-4 text-sm text-gray-500"
                                    >
                                        <span
                                            >{formatCurrency(
                                                bid.total_amount,
                                                bid.currency,
                                            )}</span
                                        >
                                        {#if bid.submitted_at}
                                            <span
                                                >Submitted: {new Date(
                                                    bid.submitted_at,
                                                ).toLocaleDateString()}</span
                                            >
                                        {/if}
                                    </div>
                                </div>

                                <div class="flex items-center space-x-2">
                                    <button
                                        class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Documents Section -->
        <div class="bg-white border border-gray-200 rounded-lg">
            <div
                class="px-4 py-3 border-b border-gray-200 flex items-center justify-between"
            >
                <h2 class="text-lg font-semibold text-gray-900">
                    Documents ({filteredDocuments.length})
                </h2>
                <div class="flex items-center space-x-2">
                    <select
                        bind:value={selectedDocStatus}
                        class="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {#each documentStatuses as status}
                            <option value={status.value}>{status.label}</option>
                        {/each}
                    </select>
                    <label
                        class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 cursor-pointer"
                    >
                        Upload
                        <input
                            type="file"
                            class="hidden"
                            on:change={uploadDocument}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                    </label>
                </div>
            </div>

            {#if loading}
                <div class="flex justify-center items-center py-8">
                    <div
                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                    ></div>
                </div>
            {:else if filteredDocuments.length === 0}
                <div class="text-center py-8 text-gray-500">
                    <svg
                        class="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">
                        No documents found
                    </h3>
                    <p class="mt-1 text-sm text-gray-500">
                        {selectedDocStatus !== "all"
                            ? "Try adjusting your filter"
                            : "Upload your business documents"}
                    </p>
                </div>
            {:else}
                <div class="divide-y divide-gray-200">
                    {#each filteredDocuments as doc}
                        <div class="p-4 hover:bg-gray-50">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <svg
                                        class="h-8 w-8 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <div>
                                        <h3
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {doc.document_type}
                                        </h3>
                                        <p class="text-sm text-gray-500">
                                            {doc.file_name} ({formatFileSize(
                                                doc.file_size,
                                            )})
                                        </p>
                                        <div
                                            class="mt-1 flex items-center space-x-2 text-xs text-gray-500"
                                        >
                                            <span
                                                >Uploaded: {new Date(
                                                    doc.upload_date,
                                                ).toLocaleDateString()}</span
                                            >
                                            {#if doc.expiry_date}
                                                <span
                                                    >Expires: {new Date(
                                                        doc.expiry_date,
                                                    ).toLocaleDateString()}</span
                                                >
                                            {/if}
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-2">
                                    <span
                                        class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
                                            doc.status,
                                        )}"
                                    >
                                        {doc.status}
                                    </span>
                                    <button
                                        on:click={() => deleteDocument(doc.id)}
                                        class="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>
