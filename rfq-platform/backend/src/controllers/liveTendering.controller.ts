import { Request, Response } from 'express';
import { liveTenderingService } from '../services/liveTendering.service';
import { liveTenderingDataSchema } from '../schemas/tenderMode.schema';
import { pool } from '../config/database';

// POST /live-tendering/sessions
export async function createLiveSession(req: Request, res: Response) {
  try {
    const data = liveTenderingDataSchema.parse(req.body);
    const session = await liveTenderingService.createLiveSession(data);
    res.status(201).json({ session });
  } catch (error) {
    console.error('Create live session error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to create live session' 
    });
  }
}

// GET /live-tendering/sessions/:tenderId
export async function getSessionByTenderId(req: Request, res: Response) {
  try {
    const { tenderId } = req.params;
    const session = await liveTenderingService.getSessionByTenderId(tenderId);
    
    if (!session) {
      return res.status(404).json({ error: 'Live session not found' });
    }
    
    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live session' 
    });
  }
}

// GET /live-tendering/sessions/:sessionId
export async function getSessionById(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await liveTenderingService.getSessionById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Live session not found' });
    }
    
    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live session' 
    });
  }
}

// POST /live-tendering/sessions/:sessionId/start
export async function startSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await liveTenderingService.startSession(sessionId);
    res.json({ session });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to start session' 
    });
  }
}

// POST /live-tendering/sessions/:sessionId/end
export async function endSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await liveTenderingService.endSession(sessionId);
    res.json({ session });
  } catch (error) {
    console.error('End session error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to end session' 
    });
  }
}

// POST /live-tendering/sessions/:sessionId/cancel
export async function cancelSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await liveTenderingService.cancelSession(sessionId);
    res.json({ session });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to cancel session' 
    });
  }
}

// GET /live-tendering/sessions/:sessionId/bids
export async function getSessionBids(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const bids = await liveTenderingService.getBidUpdates(sessionId);
    res.json({ bids });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bids' 
    });
  }
}

// POST /live-tendering/bids
export async function submitBid(req: Request, res: Response) {
  try {
    const { sessionId, amount, vendorOrgId, vendorName, notes } = req.body;
    
    // Validate required fields
    if (!sessionId || !amount || !vendorOrgId || !vendorName) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, amount, vendorOrgId, vendorName' 
      });
    }
    
    // Check if session exists and is active
    const session = await liveTenderingService.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }
    
    // Check if vendor is allowed to participate (for limited sessions)
    if (session.limitedVendors && session.limitedVendors.length > 0) {
      const isInvited = await checkVendorInvitation(sessionId, vendorOrgId);
      if (!isInvited) {
        return res.status(403).json({ error: 'Vendor not invited to this limited session' });
      }
    }
    
    // Validate bid amount based on bidding type
    const validationError = await validateBidAmount(session, amount);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    
    // Record bid update
    const bidUpdate = await liveTenderingService.recordBidUpdate(
      sessionId, 
      generateBidId(), 
      vendorOrgId, 
      'new_bid', 
      { amount, vendorName, notes }
    );
    
    // Update session stats
    await liveTenderingService.updateSessionStats(sessionId, {
      totalBidsSubmitted: session.totalBidsSubmitted + 1
    });
    
    res.status(201).json({ bidUpdate });
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({ 
      error: 'Failed to submit bid' 
    });
  }
}

// GET /live-tendering/sessions/:sessionId/access/:vendorOrgId
export async function checkVendorAccess(req: Request, res: Response) {
  try {
    const { sessionId, vendorOrgId } = req.params;
    
    const session = await liveTenderingService.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    let allowed = true;
    
    // Check if session has limited vendors
    if (session.limitedVendors && session.limitedVendors.length > 0) {
      allowed = await checkVendorInvitation(sessionId, vendorOrgId);
    }
    
    res.json({ allowed });
  } catch (error) {
    console.error('Check vendor access error:', error);
    res.status(500).json({ 
      error: 'Failed to check vendor access' 
    });
  }
}

// SSE Stream endpoint
export async function streamSessionUpdates(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      message: 'Connected to live session',
      sessionId,
      timestamp: new Date().toISOString()
    })}\n\n`);
    
    // Set up Redis subscription
    const { redisClient } = await import('../config/redis');
    const channel = `live_session:${sessionId}`;
    
    const messageHandler = (message: string) => {
      try {
        const data = JSON.parse(message);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('SSE message parse error:', err);
      }
    };
    
    // Subscribe to Redis channel
    redisClient.subscribe(channel).then(() => {
      console.log(`Subscribed to channel: ${channel}`);
    }).catch(err => {
      console.error('Redis subscribe error:', err);
    });
    
    // Handle incoming messages
    redisClient.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const data = JSON.parse(message);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (err) {
          console.error('SSE message parse error:', err);
        }
      }
    });
    
    // Handle client disconnect
    req.on('close', () => {
      redisClient.unsubscribe(channel);
      redisClient.off('message', messageHandler);
      console.log(`Client disconnected from session ${sessionId}`);
    });
    
    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }, 30000);
    
    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
    });
    
  } catch (error) {
    console.error('SSE stream error:', error);
    res.status(500).json({ error: 'Failed to establish stream' });
  }
}

// Helper functions

async function checkVendorInvitation(sessionId: string, vendorOrgId: string): Promise<boolean> {
  const { rows } = await pool.query(
    'SELECT 1 FROM limited_tender_vendors WHERE tender_id = $1 AND vendor_org_id = $2',
    [sessionId, vendorOrgId]
  );
  return rows.length > 0;
}

async function validateBidAmount(session: any, amount: number): Promise<string | null> {
  const settings = session.settings || {};
  
  // Check minimum increment for open auctions
  if (session.biddingType === 'open_auction') {
    const minIncrement = settings.minBidIncrement || 0;
    const currentBest = session.currentBestBidAmount || 0;
    
    if (amount <= currentBest) {
      return `Bid amount must be greater than current best: ${currentBest}`;
    }
    
    if (minIncrement > 0 && amount < (currentBest + minIncrement)) {
      return `Bid amount must be at least ${minIncrement} higher than current best`;
    }
  }
  
  // Check reverse auction logic
  if (session.biddingType === 'open_reverse') {
    const minIncrement = settings.minBidIncrement || 0;
    const currentBest = session.currentBestBidAmount || Infinity;
    
    if (amount >= currentBest) {
      return `Bid amount must be less than current best: ${currentBest}`;
    }
    
    if (minIncrement > 0 && amount > (currentBest - minIncrement)) {
      return `Bid amount must be at least ${minIncrement} lower than current best`;
    }
  }
  
  return null;
}

function generateBidId(): string {
  return `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}