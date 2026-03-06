<script lang="ts">
    import { onMount } from "svelte";

    interface CommitteeMember {
        id: string;
        user_id: string;
        user_name: string;
        user_email: string;
        role: string;
        status: "pending" | "active" | "completed" | "rejected";
        assigned_at: string;
        completed_at: string | null;
    }

    interface TenderCommittee {
        id: string;
        tender_id: string;
        tender_title: string;
        tender_number: string;
        status: "pending" | "active" | "completed" | "cancelled";
        members: CommitteeMember[];
        created_at: string;
    }

    let committees: TenderCommittee[] = [];
    let loading = false;
    let error: string | null = null;
    let selectedStatus = "all";

    const statuses = [
        { value: "all", label: "All Statuses" },
        { value: "pending", label: "Pending" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ] as const;

    onMount(async () => {
        await loadCommittees();
    });

    async function loadCommittees() {
        loading = true;
        error = null;

        try {
            const response = await fetch("/api/committee/my-committees", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error?.message || "Failed to load committees",
                );
            }

            const data = await response.json();
            committees = data.data;
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
        } finally {
            loading = false;
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }

    function getMemberStatusColor(status: string) {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }

    $: filteredCommittees = committees.filter((committee) => {
        const statusMatch =
            selectedStatus === "all" || committee.status === selectedStatus;
        return statusMatch;
    });

    $: statsByStatus = statuses.slice(1).reduce(
        (acc, status) => {
            acc[status.value] = committees.filter(
                (c) => c.status === status.value,
            ).length;
            return acc;
        },
        {} as Record<string, number>,
    );
</script>

<div class="committee-dashboard">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Committee Dashboard</h1>
        <p class="text-gray-600">
            Manage tender evaluation committees and track progress
        </p>
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

    <!-- Statistics Overview -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {#each statuses.slice(1) as status}
            <div
                class="bg-white border border-gray-200 rounded-lg p-4 text-center"
            >
                <div class="text-2xl font-bold text-gray-900">
                    {statsByStatus[status.value] || 0}
                </div>
                <div class="text-sm text-gray-600">{status.label}</div>
            </div>
        {/each}
    </div>

    <!-- Filters -->
    <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
            <div>
                <label
                    for="committee-status"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Filter by Status</label
                >
                <select
                    id="committee-status"
                    bind:value={selectedStatus}
                    class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {#each statuses as status}
                        <option value={status.value}>{status.label}</option>
                    {/each}
                </select>
            </div>

            <button
                on:click={loadCommittees}
                disabled={loading}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Loading..." : "Refresh"}
            </button>
        </div>
    </div>

    <!-- Committees List -->
    <div class="bg-white border border-gray-200 rounded-lg">
        <div class="px-4 py-3 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">
                Your Committees ({filteredCommittees.length})
            </h2>
        </div>

        {#if loading}
            <div class="flex justify-center items-center py-8">
                <div
                    class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                ></div>
            </div>
        {:else if filteredCommittees.length === 0}
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                    No committees found
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                    {selectedStatus !== "all"
                        ? "Try adjusting your filters"
                        : "You are not assigned to any tender committees yet"}
                </p>
            </div>
        {:else}
            <div class="divide-y divide-gray-200">
                {#each filteredCommittees as committee}
                    <div class="p-4 hover:bg-gray-50">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3">
                                    <div>
                                        <h3
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {committee.tender_title}
                                        </h3>
                                        <p class="text-sm text-gray-500">
                                            {committee.tender_number}
                                        </p>
                                    </div>
                                    <span
                                        class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
                                            committee.status,
                                        )}"
                                    >
                                        {committee.status}
                                    </span>
                                </div>

                                <div
                                    class="mt-2 flex items-center space-x-4 text-sm text-gray-500"
                                >
                                    <span
                                        >Created: {new Date(
                                            committee.created_at,
                                        ).toLocaleDateString()}</span
                                    >
                                    <span
                                        >Members: {committee.members
                                            .length}</span
                                    >
                                </div>

                                <!-- Committee Members -->
                                <div class="mt-3">
                                    <h4
                                        class="text-xs font-medium text-gray-700 mb-2"
                                    >
                                        Committee Members:
                                    </h4>
                                    <div class="flex flex-wrap gap-2">
                                        {#each committee.members as member}
                                            <div
                                                class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded text-xs"
                                            >
                                                <div
                                                    class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium"
                                                >
                                                    {member.user_name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div>
                                                    <span class="text-gray-900"
                                                        >{member.user_name}</span
                                                    >
                                                    <span
                                                        class="text-gray-500 text-xs ml-1"
                                                        >{member.role}</span
                                                    >
                                                    <span
                                                        class="px-1 py-0.5 text-xs rounded-full {getMemberStatusColor(
                                                            member.status,
                                                        )}"
                                                    >
                                                        {member.status}
                                                    </span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center space-x-2">
                                <button
                                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    View
                                </button>
                                <button
                                    class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Evaluate
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
