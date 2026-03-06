<script lang="ts">
  import { onMount } from 'svelte';
  import type { TenderRoleAssignment, WorkflowLog } from '$lib/types/workflow.types';
  
  export let tenderId: string;
  export let currentRole: string | null = null;
  
  let assignments: TenderRoleAssignment[] = [];
  let workflowLog: WorkflowLog[] = [];
  let loading = false;
  let error: string | null = null;
  let showActionModal = false;
  let selectedAction: string = '';
  let selectedToRole: string = '';
  let actionNotes: string = '';
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    error = null;
    
    try {
      // Load assignments
      const assignmentsResponse = await fetch(`/api/workflow/roles/tender/${tenderId}`);
      if (!assignmentsResponse.ok) throw new Error('Failed to load assignments');
      const assignmentsData = await assignmentsResponse.json();
      assignments = assignmentsData.data;
      
      // Load workflow log
      const logResponse = await fetch(`/api/workflow/log/${tenderId}`);
      if (!logResponse.ok) throw new Error('Failed to load workflow log');
      const logData = await logResponse.json();
      workflowLog = logData.data;
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  }
  
  async function performAction() {
    if (!selectedAction) {
      error = 'Please select an action';
      return;
    }
    
    loading = true;
    error = null;
    
    try {
      const myAssignment = assignments.find(a => a.role_type === currentRole);
      if (!myAssignment) throw new Error('Assignment not found');
      
      let endpoint = '';
      let body: any = { notes: actionNotes };
      
      switch (selectedAction) {
        case 'activate':
          endpoint = `/api/workflow/roles/${myAssignment.id}/activate`;
          break;
        case 'complete':
          endpoint = `/api/workflow/roles/${myAssignment.id}/complete`;
          break;
        case 'forward':
          if (!selectedToRole) {
            error = 'Please select a role to forward to';
            loading = false;
            return;
          }
          endpoint = `/api/workflow/roles/${myAssignment.id}/forward`;
          body.toRole = selectedToRole;
          break;
        case 'skip':
          endpoint = `/api/workflow/roles/${myAssignment.id}/skip`;
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to perform action');
      }
      
      await loadData();
      showActionModal = false;
      selectedAction = '';
      selectedToRole = '';
      actionNotes = '';
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to perform action';
    } finally {
      loading = false;
    }
  }
  
  function getMyAssignment(): TenderRoleAssignment | null {
    return assignments.find(a => a.role_type === currentRole) || null;
  }
  
  function getAvailableActions(): string[] {
    const myAssignment = getMyAssignment();
    if (!myAssignment) return [];
    
    const actions: string[] = [];
    
    switch (myAssignment.status) {
      case 'pending':
        actions.push('activate', 'skip');
        break;
      case 'active':
        actions.push('complete', 'forward');
        break;
      case 'completed':
        actions.push('forward');
        break;
    }
    
    return actions;
  }
  
  function getAvailableRoles(): string[] {
    const myAssignment = getMyAssignment();
    if (!myAssignment) return [];
    
    return assignments
      .filter(a => a.status === 'pending' && a.role_type !== myAssignment.role_type)
      .map(a => a.role_type);
  }
  
  function getActionIcon(action: string): string {
    const iconMap: Record<string, string> = {
      'assigned': '👤',
      'activated': '▶️',
      'completed': '✅',
      'forwarded': '➡️',
      'skipped': '⏭️',
      'reassigned': '🔄'
    };
    return iconMap[action] || '📝';
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'forwarded': return 'bg-purple-100 text-purple-800';
      case 'skipped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  }
  
  function getRoleDisplayName(role: string): string {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  function openActionModal(action: string) {
    selectedAction = action;
    selectedToRole = '';
    actionNotes = '';
    showActionModal = true;
  }
</script>

<div class="workflow-panel">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Workflow Panel</h1>
    <p class="text-gray-600">Manage tender workflow and role assignments</p>
  </div>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">{error}</div>
        </div>
      </div>
    </div>
  {/if}
  
  {#if loading}
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- My Role Status -->
    {#if currentRole}
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">My Role Status</h2>
        
        {#each assignments.filter(a => a.role_type === currentRole) as assignment}
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {getRoleDisplayName(assignment.role_type).charAt(0)}
              </div>
              <div>
                <h3 class="font-medium text-gray-900">{getRoleDisplayName(assignment.role_type)}</h3>
                <p class="text-sm text-gray-500">Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="text-right">
              <span class="px-3 py-1 text-sm font-medium rounded-full {getStatusColor(assignment.status)}">
                {assignment.status}
              </span>
              
              {#if assignment.activated_at}
                <p class="text-xs text-gray-500 mt-1">Activated: {new Date(assignment.activated_at).toLocaleDateString()}</p>
              {/if}
            </div>
          </div>
          
          <!-- Available Actions -->
          {#if getAvailableActions().length > 0}
            <div class="mt-4 pt-4 border-t border-gray-200">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Available Actions</h4>
              <div class="flex flex-wrap gap-2">
                {#each getAvailableActions() as action}
                  <button
                    on:click={() => openActionModal(action)}
                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
    
    <!-- All Role Assignments -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">All Role Assignments</h2>
      
      <div class="space-y-3">
        {#each assignments as assignment}
          <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {assignment.assigned_user_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="text-sm font-medium text-gray-900">{assignment.assigned_user_name}</div>
                <div class="text-xs text-gray-500">{getRoleDisplayName(assignment.role_type)}</div>
              </div>
            </div>
            
            <div class="text-right">
              <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(assignment.status)}">
                {assignment.status}
              </span>
              <div class="text-xs text-gray-500 mt-1">
                {new Date(assignment.assigned_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Workflow Log -->
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Workflow Log</h2>
      
      {#if workflowLog.length === 0}
        <div class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No workflow activity yet</h3>
          <p class="mt-1 text-sm text-gray-500">Actions will appear here as the workflow progresses</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each workflowLog as log}
            <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
              <div class="flex-shrink-0">
                <span class="text-2xl">{getActionIcon(log.action)}</span>
              </div>
              
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 capitalize">{log.action}</h4>
                    <p class="text-xs text-gray-500">
                      by {log.actor_name} on {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div class="text-right">
                    {#if log.from_role}
                      <span class="text-xs text-gray-500">From: {getRoleDisplayName(log.from_role)}</span>
                    {/if}
                    {#if log.to_role}
                      <span class="text-xs text-gray-500">To: {getRoleDisplayName(log.to_role)}</span>
                    {/if}
                  </div>
                </div>
                
                {#if log.notes}
                  <p class="text-sm text-gray-600 mt-2">{log.notes}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Action Modal -->
  {#if showActionModal}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" on:click={() => showActionModal = false}>
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" on:click|stopPropagation>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Role
            </h3>
            <button
              on:click={() => showActionModal = false}
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="space-y-4">
            {#if selectedAction === 'forward'}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Forward To Role</label>
                <select
                  bind:value={selectedToRole}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role</option>
                  {#each getAvailableRoles() as role}
                    <option value={role}>{getRoleDisplayName(role)}</option>
                  {/each}
                </select>
              </div>
            {/if}
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                bind:value={actionNotes}
                rows={3}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes for this action"
              ></textarea>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button
              on:click={() => showActionModal = false}
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              on:click={performAction}
              disabled={loading || (selectedAction === 'forward' && !selectedToRole)}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
