<script lang="ts">
  // Live Bidding Dashboard
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/utils/api';
  import { user } from '$lib/stores/auth';

  let tenderId = $page.params.id;
  let session: any = null;
  let bids: any[] = [];
  let myBid: any = null;
  let isParticipating = false;
  let error = '';
  let isSubmittingBid = false;
  let bidAmount = 0;
  let countdown: string = '';
  let isSessionActive = false;
  let isSessionEnded = false;
  
  // SSE connection
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  let maxReconnectAttempts = 5;

  // Bid submission data
  let bidFormData = {
    amount: 0,
    vendorOrgId: '',
    vendorName: '',
    notes: ''
  };

  // Load session data
  async function loadSession() {
    try {
      const response = await api.get(`/live-tendering/sessions/${tenderId}`);
      session = response.data;
      
      if (session) {
        await loadBids();
        checkParticipation();
        startCountdown();
      }
    } catch (err) {
      error = 'Failed to load live session';
      console.error('Load session error:', err);
    }
  }

  // Load bids for the session
  async function loadBids() {
    try {
      const response = await api.get(`/live-tendering/sessions/${session.id}/bids`);
      bids = response.data || [];
      
      // Check if user has already bid
      if ($user?.orgId) {
        myBid = bids.find(bid => bid.vendorOrgId === $user.orgId);
      }
    } catch (err) {
      console.error('Load bids error:', err);
    }
  }

  // Check if user can participate
  async function checkParticipation() {
    if (!session || !$user?.orgId) return;
    
    try {
      const response = await api.get(`/live-tendering/sessions/${session.id}/access/${$user.orgId}`);
      isParticipating = response.data.allowed;
      
      if (isParticipating) {
        bidFormData.vendorOrgId = $user.orgId;
        bidFormData.vendorName = $user.organizationName || $user.name;
      }
    } catch (err) {
      console.error('Check participation error:', err);
    }
  }

  // Start countdown timer
  function startCountdown() {
    if (!session) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const startTime = new Date(session.scheduledStart);
      const endTime = new Date(session.scheduledEnd);
      
      if (now < startTime) {
        // Session not started yet
        const diff = startTime.getTime() - now.getTime();
        countdown = `Starts in: ${formatTime(diff)}`;
        isSessionActive = false;
        isSessionEnded = false;
      } else if (now >= startTime && now < endTime) {
        // Session active
        const diff = endTime.getTime() - now.getTime();
        countdown = `Ends in: ${formatTime(diff)}`;
        isSessionActive = true;
        isSessionEnded = false;
      } else {
        // Session ended
        countdown = 'Session Ended';
        isSessionActive = false;
        isSessionEnded = true;
      }
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Format time display
  function formatTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Submit bid
  async function submitBid() {
    if (!session || !isSessionActive || isSubmittingBid) return;
    
    isSubmittingBid = true;
    error = '';
    
    try {
      const payload = {
        sessionId: session.id,
        amount: bidFormData.amount,
        vendorOrgId: bidFormData.vendorOrgId,
        vendorName: bidFormData.vendorName,
        notes: bidFormData.notes
      };
      
      await api.post('/live-tendering/bids', payload);
      
      // Clear form
      bidFormData.amount = 0;
      bidFormData.notes = '';
      
      // Reload bids
      await loadBids();
    } catch (err: any) {
      error = err.response?.data?.error?.message || 'Failed to submit bid';
    } finally {
      isSubmittingBid = false;
    }
  }

  // Setup SSE connection
  function setupSSE() {
    if (!session) return;
    
    eventSource = new EventSource(`/api/live-tendering/sessions/${session.id}/stream`);
    
    eventSource.onopen = () => {
      reconnectAttempts = 0;
      console.log('SSE connection opened');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleLiveUpdate(data);
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      reconnectSSE();
    };
  }

  // Handle live updates
  function handleLiveUpdate(data: any) {
    if (data.type === 'session_event') {
      if (data.eventType === 'session_started') {
        isSessionActive = true;
        isSessionEnded = false;
      } else if (data.eventType === 'session_ended') {
        isSessionActive = false;
        isSessionEnded = true;
      }
    } else if (data.type === 'bid_event') {
      // Reload bids to get latest data
      loadBids();
    }
  }

  // Reconnect SSE
  function reconnectSSE() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max SSE reconnection attempts reached');
      return;
    }
    
    reconnectAttempts++;
    setTimeout(() => {
      if (eventSource) {
        eventSource.close();
      }
      setupSSE();
    }, 2000 * reconnectAttempts);
  }

  // Calculate minimum bid increment
  function getMinimumBid(): number {
    if (!session || !myBid) return 0;
    
    const currentBest = session.currentBestBidAmount || 0;
    const minIncrement = session.settings?.minBidIncrement || 0;
    
    if (session.biddingType === 'open_auction') {
      return currentBest + minIncrement;
    } else if (session.biddingType === 'open_reverse') {
      return Math.max(0, currentBest - minIncrement);
    }
    
    return 0;
  }

  // Get bid status class
  function getBidStatusClass(bid: any): string {
    if (bid.isCurrentBest) return 'chaingpt-badge-success';
    if (bid.isOutbid) return 'chaingpt-badge-warning';
    return 'chaingpt-badge-info';
  }

  // Get bid status text
  function getBidStatusText(bid: any): string {
    if (bid.isCurrentBest) return 'Leading';
    if (bid.isOutbid) return 'Outbid';
    return 'Submitted';
  }

  onMount(() => {
    loadSession();
    setupSSE();
  });

  onDestroy(() => {
    if (eventSource) {
      eventSource.close();
    }
  });
</script>

<div class="chaingpt-card chaingpt-mb-6">
  <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center chaingpt-mb-4">
    <h2>Live Auction Dashboard</h2>
    <div class="chaingpt-text-sm chaingpt-text-muted">
      Session: {session?.id}
    </div>
  </div>

  {#if error}
    <div class="chaingpt-alert chaingpt-alert-danger">{error}</div>
  {/if}

  {#if !session}
    <div class="chaingpt-skeleton" style="height: 20px; width: 100%;"></div>
  {:else}
    <!-- Session Info -->
    <div class="chaingpt-grid chaingpt-grid-3 chaingpt-gap-4 chaingpt-mb-6">
      <div class="chaingpt-card chaingpt-p-4">
        <div class="chaingpt-text-sm chaingpt-text-muted">Countdown</div>
        <div class="chaingpt-text-2xl chaingpt-font-bold">{countdown}</div>
      </div>
      
      <div class="chaingpt-card chaingpt-p-4">
        <div class="chaingpt-text-sm chaingpt-text-muted">Bidding Type</div>
        <div class="chaingpt-text-lg chaingpt-font-bold">
          {session.biddingType === 'open_auction' ? 'Open Auction' : 
           session.biddingType === 'open_reverse' ? 'Open Reverse' : 'Sealed Bids'}
        </div>
      </div>
      
      <div class="chaingpt-card chaingpt-p-4">
        <div class="chaingpt-text-sm chaingpt-text-muted">Total Bids</div>
        <div class="chaingpt-text-lg chaingpt-font-bold">{bids.length}</div>
      </div>
    </div>

    <!-- Session Status -->
    <div class="chaingpt-mb-6">
      {#if isSessionActive}
        <div class="chaingpt-alert chaingpt-alert-success chaingpt-flex chaingpt-justify-between chaingpt-items-center">
          <span>Session is Active - Bidding Open</span>
          <span class="chaingpt-badge chaingpt-badge-success">LIVE</span>
        </div>
      {:else if isSessionEnded}
        <div class="chaingpt-alert chaingpt-alert-info chaingpt-flex chaingpt-justify-between chaingpt-items-center">
          <span>Session has Ended</span>
          <span class="chaingpt-badge chaingpt-badge-info">ENDED</span>
        </div>
      {:else}
        <div class="chaingpt-alert chaingpt-alert-warning chaingpt-flex chaingpt-justify-between chaingpt-items-center">
          <span>Session Scheduled - Bidding Not Started</span>
          <span class="chaingpt-badge chaingpt-badge-warning">SCHEDULED</span>
        </div>
      {/if}
    </div>

    <!-- Participation Check -->
    {#if !isParticipating}
      <div class="chaingpt-alert chaingpt-alert-warning">
        You are not invited to participate in this limited tender. 
        Contact the buyer for access.
      </div>
    {:else if !isSessionActive}
      <div class="chaingpt-alert chaingpt-alert-info">
        Bidding will start when the session begins. Prepare your bid.
      </div>
    {:else}
      <!-- Bid Submission Form -->
      <div class="chaingpt-card chaingpt-p-4 chaingpt-mb-6">
        <h3 class="chaingpt-mb-4">Submit Your Bid</h3>
        
        <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4">
          <div>
            <label class="chaingpt-block chaingpt-text-sm chaingpt-text-muted chaingpt-mb-2">Bid Amount</label>
            <input 
              type="number" 
              min="0" 
              step="0.01"
              bind:value={bidFormData.amount}
              class="chaingpt-input"
              placeholder="Enter your bid amount"
            />
            {#if session.biddingType === 'open_auction' && myBid}
              <div class="chaingpt-text-xs chaingpt-text-muted chaingpt-mt-1">
                Minimum increment: {getMinimumBid().toFixed(2)}
              </div>
            {/if}
          </div>
          
          <div>
            <label class="chaingpt-block chaingpt-text-sm chaingpt-text-muted chaingpt-mb-2">Vendor</label>
            <input 
              type="text" 
              bind:value={bidFormData.vendorName}
              class="chaingpt-input"
              readonly
            />
          </div>
        </div>
        
        <div class="chaingpt-mt-4">
          <label class="chaingpt-block chaingpt-text-sm chaingpt-text-muted chaingpt-mb-2">Notes (Optional)</label>
          <textarea 
            bind:value={bidFormData.notes}
            class="chaingpt-input"
            rows="3"
            placeholder="Any additional information..."
          ></textarea>
        </div>
        
        <div class="chaingpt-mt-4 chaingpt-flex chaingpt-justify-between chaingpt-items-center">
          <div class="chaingpt-text-sm chaingpt-text-muted">
            {session.settings?.bidVisibility === 'hidden' ? 'Bids are hidden' : 
             session.settings?.bidVisibility === 'visible' ? 'Bids are visible' : 'Bids visible after close'}
          </div>
          <button 
            class="chaingpt-btn chaingpt-btn-primary"
            on:click={submitBid}
            disabled={isSubmittingBid || !isSessionActive}
          >
            {isSubmittingBid ? 'Submitting...' : 'Submit Bid'}
          </button>
        </div>
      </div>
    {/if}

    <!-- Bid History -->
    <div class="chaingpt-card chaingpt-p-4">
      <h3 class="chaingpt-mb-4">Bid History</h3>
      
      {#if bids.length === 0}
        <div class="chaingpt-text-center chaingpt-text-muted chaingpt-py-8">
          No bids submitted yet
        </div>
      {:else}
        <div class="chaingpt-space-y-3">
          {#each bids as bid}
            <div class="chaingpt-flex chaingpt-justify-between chaingpt-items-center chaingpt-p-3 chaingpt-border chaingpt-rounded">
              <div>
                <div class="chaingpt-font-medium">{bid.vendorName}</div>
                <div class="chaingpt-text-sm chaingpt-text-muted">
                  {new Date(bid.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div class="chaingpt-flex chaingpt-items-center chaingpt-gap-4">
                <div class="chaingpt-text-lg chaingpt-font-bold">
                  {bid.amount.toLocaleString()} {session.settings?.currency || 'BDT'}
                </div>
                <span class="chaingpt-badge {getBidStatusClass(bid)}">
                  {getBidStatusText(bid)}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Session Details -->
    <div class="chaingpt-card chaingpt-p-4 chaingpt-mt-6">
      <h3 class="chaingpt-mb-4">Session Details</h3>
      <div class="chaingpt-grid chaingpt-grid-2 chaingpt-gap-4">
        <div>
          <div class="chaingpt-text-sm chaingpt-text-muted">Scheduled Start</div>
          <div class="chaingpt-font-medium">{new Date(session.scheduledStart).toLocaleString()}</div>
        </div>
        <div>
          <div class="chaingpt-text-sm chaingpt-text-muted">Scheduled End</div>
          <div class="chaingpt-font-medium">{new Date(session.scheduledEnd).toLocaleString()}</div>
        </div>
        <div>
          <div class="chaingpt-text-sm chaingpt-text-muted">Auto Extend</div>
          <div class="chaingpt-font-medium">
            {session.settings?.autoExtendOnLastMinute ? 'Yes' : 'No'}
            {#if session.settings?.autoExtendOnLastMinute}
              ({session.settings.extensionMinutes} minutes)
            {/if}
          </div>
        </div>
        <div>
          <div class="chaingpt-text-sm chaingpt-text-muted">Allow Withdrawal</div>
          <div class="chaingpt-font-medium">
            {session.settings?.allowBidWithdrawal ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>