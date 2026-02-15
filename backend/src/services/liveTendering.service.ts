import { pool } from '../config/database';
import { redisClient } from '../config/redis';
import { liveTenderingDataSchema } from '../schemas/tenderMode.schema';
import { v4 as uuidv4 } from 'uuid';

export interface LiveTenderingSession {
  id: string;
  tenderId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  biddingType: 'sealed' | 'open_reverse' | 'open_auction';
  currentBestBidId?: string;
  totalBidsSubmitted: number;
  settings: {
    minBidIncrement?: number;
    bidVisibility?: 'hidden' | 'visible' | 'after_close';
    allowBidWithdrawal?: boolean;
    requirePrequalification?: boolean;
    autoExtendOnLastMinute?: boolean;
    extensionMinutes?: number;
  };
  limitedVendors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveBidUpdate {
  id: string;
  sessionId: string;
  bidId?: string;
  vendorOrgId: string;
  eventType: 'new_bid' | 'bid_withdrawn' | 'bid_improved' | 'outbid';
  eventData: any;
  createdAt: Date;
}

export const liveTenderingService = {
  /**
   * Create a new live tendering session
   */
  async createLiveSession(data: any): Promise<LiveTenderingSession> {
    const validatedData = liveTenderingDataSchema.parse(data);
    
    // Validate tender exists and is not already live
    const tenderResult = await pool.query(
      'SELECT id, tender_mode, status FROM tenders WHERE id = $1',
      [validatedData.tenderId]
    );
    
    if (tenderResult.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), {
        statusCode: 404,
        code: 'TENDER_NOT_FOUND'
      });
    }
    
    const tender = tenderResult.rows[0];
    
    if (tender.status !== 'published') {
      throw Object.assign(new Error('Tender must be published to enable live tendering'), {
        statusCode: 400,
        code: 'INVALID_TENDER_STATUS'
      });
    }
    
    // Check if tender already has a live session
    const existingSession = await pool.query(
      'SELECT id FROM live_bidding_sessions WHERE tender_id = $1',
      [validatedData.tenderId]
    );
    
    if (existingSession.rows.length > 0) {
      throw Object.assign(new Error('Tender already has a live session'), {
        statusCode: 400,
        code: 'LIVE_SESSION_EXISTS'
      });
    }
    
    const sessionId = uuidv4();
    const scheduledStart = new Date(validatedData.scheduledStart);
    const scheduledEnd = new Date(validatedData.scheduledEnd);
    
    // Validate timing
    if (scheduledStart >= scheduledEnd) {
      throw Object.assign(new Error('Scheduled start must be before scheduled end'), {
        statusCode: 400,
        code: 'INVALID_TIMING'
      });
    }
    
    if (scheduledStart < new Date()) {
      throw Object.assign(new Error('Scheduled start must be in the future'), {
        statusCode: 400,
        code: 'INVALID_START_TIME'
      });
    }
    
    // Insert live session
    const result = await pool.query<LiveTenderingSession>(
      `INSERT INTO live_bidding_sessions (
         id, tender_id, scheduled_start, scheduled_end, status, bidding_type, settings
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        sessionId,
        validatedData.tenderId,
        scheduledStart,
        scheduledEnd,
        'scheduled',
        validatedData.biddingType,
        JSON.stringify(validatedData.settings || {})
      ]
    );
    
    const session = result.rows[0];
    
    // Update tender to mark as live
    await pool.query(
      'UPDATE tenders SET is_live_tendering = true, live_session_id = $1 WHERE id = $2',
      [sessionId, validatedData.tenderId]
    );
    
    // Store in Redis for quick access
    await redisClient.setex(
      `live_session:${sessionId}`,
      86400, // 24 hours
      JSON.stringify(session)
    );
    
    // Publish session created event
    await this.publishSessionEvent(sessionId, 'session_created', {
      tenderId: validatedData.tenderId,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
      biddingType: validatedData.biddingType
    });
    
    return session;
  },
  
  /**
   * Get live session by tender ID
   */
  async getSessionByTenderId(tenderId: string): Promise<LiveTenderingSession | null> {
    // Try Redis first
    const cached = await redisClient.get(`live_session_tender:${tenderId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database
    const result = await pool.query<LiveTenderingSession>(
      `SELECT * FROM live_bidding_sessions WHERE tender_id = $1`,
      [tenderId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const session = result.rows[0];
    
    // Cache in Redis
    await redisClient.setex(
      `live_session_tender:${tenderId}`,
      3600, // 1 hour
      JSON.stringify(session)
    );
    
    return session;
  },
  
  /**
   * Get live session by session ID
   */
  async getSessionById(sessionId: string): Promise<LiveTenderingSession | null> {
    // Try Redis first
    const cached = await redisClient.get(`live_session:${sessionId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database
    const result = await pool.query<LiveTenderingSession>(
      `SELECT * FROM live_bidding_sessions WHERE id = $1`,
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const session = result.rows[0];
    
    // Cache in Redis
    await redisClient.setex(
      `live_session:${sessionId}`,
      3600, // 1 hour
      JSON.stringify(session)
    );
    
    return session;
  },
  
  /**
   * Start a live session
   */
  async startSession(sessionId: string): Promise<LiveTenderingSession> {
    const result = await pool.query<LiveTenderingSession>(
      `UPDATE live_bidding_sessions 
       SET status = 'active', actual_start = NOW()
       WHERE id = $1 AND status = 'scheduled'
       RETURNING *`,
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Session not found or not in scheduled state'), {
        statusCode: 404,
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    const session = result.rows[0];
    
    // Update Redis cache
    await redisClient.setex(
      `live_session:${sessionId}`,
      3600,
      JSON.stringify(session)
    );
    
    // Publish session started event
    await this.publishSessionEvent(sessionId, 'session_started', {
      actualStart: session.actualStart?.toISOString()
    });
    
    return session;
  },
  
  /**
   * End a live session
   */
  async endSession(sessionId: string): Promise<LiveTenderingSession> {
    const result = await pool.query<LiveTenderingSession>(
      `UPDATE live_bidding_sessions 
       SET status = 'completed', actual_end = NOW()
       WHERE id = $1 AND status = 'active'
       RETURNING *`,
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Session not found or not active'), {
        statusCode: 404,
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    const session = result.rows[0];
    
    // Update Redis cache
    await redisClient.setex(
      `live_session:${sessionId}`,
      3600,
      JSON.stringify(session)
    );
    
    // Publish session ended event
    await this.publishSessionEvent(sessionId, 'session_ended', {
      actualEnd: session.actualEnd?.toISOString(),
      totalBids: session.totalBidsSubmitted
    });
    
    return session;
  },
  
  /**
   * Cancel a live session
   */
  async cancelSession(sessionId: string): Promise<LiveTenderingSession> {
    const result = await pool.query<LiveTenderingSession>(
      `UPDATE live_bidding_sessions 
       SET status = 'cancelled'
       WHERE id = $1 AND status IN ('scheduled', 'active')
       RETURNING *`,
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Session not found or cannot be cancelled'), {
        statusCode: 404,
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    const session = result.rows[0];
    
    // Update Redis cache
    await redisClient.setex(
      `live_session:${sessionId}`,
      3600,
      JSON.stringify(session)
    );
    
    // Publish session cancelled event
    await this.publishSessionEvent(sessionId, 'session_cancelled', {});
    
    return session;
  },
  
  /**
   * Record a bid update event
   */
  async recordBidUpdate(
    sessionId: string,
    bidId: string,
    vendorOrgId: string,
    eventType: 'new_bid' | 'bid_withdrawn' | 'bid_improved' | 'outbid',
    eventData: any
  ): Promise<LiveBidUpdate> {
    const result = await pool.query<LiveBidUpdate>(
      `INSERT INTO live_bid_updates (
         session_id, bid_id, vendor_org_id, event_type, event_data
       ) VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sessionId, bidId, vendorOrgId, eventType, JSON.stringify(eventData)]
    );
    
    const update = result.rows[0];
    
    // Publish bid update event
    await this.publishBidEvent(sessionId, eventType, {
      bidId,
      vendorOrgId,
      eventData
    });
    
    return update;
  },
  
  /**
   * Get recent bid updates for a session
   */
  async getBidUpdates(sessionId: string, limit: number = 50): Promise<LiveBidUpdate[]> {
    const result = await pool.query<LiveBidUpdate>(
      `SELECT * FROM live_bid_updates 
       WHERE session_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [sessionId, limit]
    );
    
    return result.rows;
  },
  
  /**
   * Update session statistics
   */
  async updateSessionStats(sessionId: string, stats: { totalBidsSubmitted?: number; currentBestBidId?: string }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    if (stats.totalBidsSubmitted !== undefined) {
      updates.push(`total_bids_submitted = $${paramCount}`);
      params.push(stats.totalBidsSubmitted);
      paramCount++;
    }
    
    if (stats.currentBestBidId !== undefined) {
      updates.push(`current_best_bid_id = $${paramCount}`);
      params.push(stats.currentBestBidId);
      paramCount++;
    }
    
    if (updates.length === 0) return;
    
    params.push(sessionId);
    
    await pool.query(
      `UPDATE live_bidding_sessions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
      params
    );
    
    // Invalidate Redis cache
    await redisClient.del(`live_session:${sessionId}`);
  },
  
  /**
   * Publish session event to Redis
   */
  async publishSessionEvent(sessionId: string, eventType: string, data: any): Promise<void> {
    const event = {
      type: 'session_event',
      sessionId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    await redisClient.publish(`live_session:${sessionId}`, JSON.stringify(event));
  },
  
  /**
   * Publish bid event to Redis
   */
  async publishBidEvent(sessionId: string, eventType: string, data: any): Promise<void> {
    const event = {
      type: 'bid_event',
      sessionId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    await redisClient.publish(`live_session:${sessionId}`, JSON.stringify(event));
  },
  
  /**
   * Get active sessions for monitoring
   */
  async getActiveSessions(): Promise<LiveTenderingSession[]> {
    const result = await pool.query<LiveTenderingSession>(
      `SELECT * FROM live_bidding_sessions 
       WHERE status IN ('scheduled', 'active')
       ORDER BY scheduled_start ASC`
    );
    
    return result.rows;
  },
  
  /**
   * Cleanup expired sessions (for scheduled sessions that never started)
   */
  async cleanupExpiredSessions(): Promise<void> {
    await pool.query(
      `UPDATE live_bidding_sessions 
       SET status = 'cancelled'
       WHERE status = 'scheduled' AND scheduled_start < NOW() - INTERVAL '1 hour'`
    );
  }
};