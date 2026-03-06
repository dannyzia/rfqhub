// backend/src/services/__tests__/liveTendering.service.test.ts
// Skills: surgical_execution + architecture_respect

jest.mock("../../config/database", () => {
  const pool = { query: jest.fn() };
  return { __esModule: true, default: pool, pool };
});
jest.mock("../../config/redis", () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    quit: jest.fn(),
  },
}));

import { liveTenderingService } from "../liveTendering.service";
import { redisClient } from "../../config/redis";

describe("LiveTenderingService", () => {
  const { pool } = require("../../config/database");

  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockReset();
    (redisClient.get as jest.Mock).mockReset();
    (redisClient.set as jest.Mock).mockReset();
    (redisClient.setex as jest.Mock).mockReset();
    (redisClient.del as jest.Mock).mockReset();
    (redisClient.publish as jest.Mock).mockReset();
  });

  describe("createLiveSession", () => {
    const validSessionData = {
      tenderId: "tender-001",
      scheduledStart: new Date(Date.now() + 3600000).toISOString(),
      scheduledEnd: new Date(Date.now() + 7200000).toISOString(),
      biddingType: "open_reverse" as const,
      settings: {
        minBidIncrement: 100,
        bidVisibility: "hidden" as const,
        allowBidWithdrawal: false,
        autoExtendOnLastMinute: true,
        extensionMinutes: 5,
      },
    };

    it("should create live session with valid config", async () => {
      const mockTender = {
        id: "tender-001",
        tender_mode: "limited_tendering",
        status: "published",
      };

      const mockSession = {
        id: "session-001",
        tender_id: "tender-001",
        scheduled_start: validSessionData.scheduledStart,
        scheduled_end: validSessionData.scheduledEnd,
        actual_start: null,
        actual_end: null,
        status: "scheduled",
        bidding_type: validSessionData.biddingType,
        current_best_bid_id: null,
        total_bids_submitted: 0,
        settings: validSessionData.settings,
        limited_vendors: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTender], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [mockSession], rowCount: 1 });

      const result =
        await liveTenderingService.createLiveSession(validSessionData);

      expect(result).toEqual({
        id: "session-001",
        tenderId: "tender-001",
        scheduledStart: new Date(validSessionData.scheduledStart),
        scheduledEnd: new Date(validSessionData.scheduledEnd),
        actualStart: undefined,
        actualEnd: undefined,
        status: "scheduled",
        biddingType: "open_reverse",
        currentBestBidId: undefined,
        totalBidsSubmitted: 0,
        settings: validSessionData.settings,
        limitedVendors: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should reject when tender not found", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        liveTenderingService.createLiveSession(validSessionData),
      ).rejects.toThrow("Tender not found");
    });

    it("should reject when tender not published", async () => {
      const mockTender = {
        id: "tender-001",
        tender_mode: "limited_tendering",
        status: "draft",
      };

      pool.query.mockResolvedValueOnce({ rows: [mockTender], rowCount: 1 });

      await expect(
        liveTenderingService.createLiveSession(validSessionData),
      ).rejects.toThrow("Tender must be published");
    });

    it("should reject when live session already exists", async () => {
      const mockTender = {
        id: "tender-001",
        tender_mode: "limited_tendering",
        status: "published",
      };

      const existingSession = {
        id: "existing-session",
        tender_id: "tender-001",
      };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTender], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [existingSession], rowCount: 1 });

      await expect(
        liveTenderingService.createLiveSession(validSessionData),
      ).rejects.toThrow("Tender already has a live session");
    });

    it("should create session with limited vendors", async () => {
      const sessionData = {
        ...validSessionData,
        limitedVendors: ["vendor-001", "vendor-002"],
      };

      const mockTender = {
        id: "tender-001",
        tender_mode: "limited_tendering",
        status: "published",
      };

      const mockSession = {
        id: "session-001",
        tender_id: "tender-001",
        limited_vendors: sessionData.limitedVendors,
        status: "scheduled",
      };

      pool.query
        .mockResolvedValueOnce({ rows: [mockTender], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [mockSession], rowCount: 1 });

      const result = await liveTenderingService.createLiveSession(sessionData);

      expect(result.limitedVendors).toEqual(["vendor-001", "vendor-002"]);
    });
  });

  describe("getSessionByTenderId", () => {
    it("should return session for tender", async () => {
      const mockSession = {
        id: "session-001",
        tender_id: "tender-001",
        status: "scheduled",
        bidding_type: "open_reverse",
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        total_bids_submitted: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      pool.query.mockResolvedValue({ rows: [mockSession], rowCount: 1 });

      const result =
        await liveTenderingService.getSessionByTenderId("tender-001");

      expect(result).toEqual({
        id: "session-001",
        tenderId: "tender-001",
        status: "scheduled",
        biddingType: "open_reverse",
        scheduledStart: expect.any(Date),
        scheduledEnd: expect.any(Date),
        actualStart: undefined,
        actualEnd: undefined,
        currentBestBidId: undefined,
        totalBidsSubmitted: 0,
        settings: {},
        limitedVendors: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should return null when no session found", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result =
        await liveTenderingService.getSessionByTenderId("tender-999");

      expect(result).toBeNull();
    });
  });

  describe("getSessionById", () => {
    it("should return session by id", async () => {
      const mockSession = {
        id: "session-001",
        tender_id: "tender-001",
        status: "active",
        bidding_type: "open_reverse",
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        actual_start: new Date().toISOString(),
        total_bids_submitted: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      pool.query.mockResolvedValue({ rows: [mockSession], rowCount: 1 });

      const result = await liveTenderingService.getSessionById("session-001");

      expect(result).toEqual({
        id: "session-001",
        tenderId: "tender-001",
        status: "active",
        biddingType: "open_reverse",
        scheduledStart: expect.any(Date),
        scheduledEnd: expect.any(Date),
        actualStart: expect.any(Date),
        actualEnd: undefined,
        currentBestBidId: undefined,
        totalBidsSubmitted: 5,
        settings: {},
        limitedVendors: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should return null when session not found", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await liveTenderingService.getSessionById("session-999");

      expect(result).toBeNull();
    });
  });

  describe("startSession", () => {
    it("should start a scheduled session", async () => {
      const mockSession = {
        id: "session-001",
        tender_id: "tender-001",
        status: "active",
        actual_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      pool.query.mockResolvedValue({ rows: [mockSession], rowCount: 1 });

      const result = await liveTenderingService.startSession("session-001");

      expect(result.status).toBe("active");
      expect(result.actualStart).toBeDefined();
    });

    it("should reject when session not found", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        liveTenderingService.startSession("session-999"),
      ).rejects.toThrow("Session not found");
    });
  });

  describe("endSession", () => {
    it("should end an active session", async () => {
      const mockSession = {
        id: "session-001",
        tender_id: "tender-001",
        status: "completed",
        actual_end: new Date().toISOString(),
        total_bids_submitted: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      pool.query.mockResolvedValue({ rows: [mockSession], rowCount: 1 });
      (redisClient.setex as jest.Mock).mockResolvedValue(1);
      (redisClient.publish as jest.Mock).mockResolvedValue(1);

      const result = await liveTenderingService.endSession("session-001");

      expect(result.status).toBe("completed");
      expect(result.actualEnd).toBeDefined();
      expect(redisClient.setex).toHaveBeenCalledWith(
        "live_session:session-001",
        3600,
        expect.any(String),
      );
      expect(redisClient.publish).toHaveBeenCalledWith(
        "live_session:session-001",
        expect.any(String),
      );
    });

    it("should reject ending already ended session", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        liveTenderingService.endSession("session-002"),
      ).rejects.toThrow("Session not found or not active");
    });
  });

  describe("cancelSession", () => {
    it("should cancel a scheduled or active session", async () => {
      const mockSession = {
        id: "session-001",
        tender_id: "tender-001",
        status: "cancelled",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      pool.query.mockResolvedValue({ rows: [mockSession], rowCount: 1 });
      (redisClient.setex as jest.Mock).mockResolvedValue(1);
      (redisClient.publish as jest.Mock).mockResolvedValue(1);

      const result = await liveTenderingService.cancelSession("session-001");

      expect(result.status).toBe("cancelled");
      expect(redisClient.publish).toHaveBeenCalledWith(
        "live_session:session-001",
        expect.any(String),
      );
    });

    it("should reject when session not found or cannot be cancelled", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        liveTenderingService.cancelSession("session-002"),
      ).rejects.toThrow("Session not found or cannot be cancelled");
    });
  });

  describe("recordBidUpdate", () => {
    it("should record bid update event", async () => {
      const mockUpdate = {
        id: "update-001",
        session_id: "session-001",
        bid_id: "bid-001",
        vendor_org_id: "vendor-001",
        event_type: "new_bid",
        event_data: { amount: 1000 },
        created_at: new Date().toISOString(),
      };

      pool.query.mockResolvedValue({ rows: [mockUpdate], rowCount: 1 });

      const result = await liveTenderingService.recordBidUpdate(
        "session-001",
        "bid-001",
        "vendor-001",
        "new_bid",
        { amount: 1000 },
      );

      expect(result).toEqual({
        id: "update-001",
        sessionId: "session-001",
        bidId: "bid-001",
        vendorOrgId: "vendor-001",
        eventType: "new_bid",
        eventData: { amount: 1000 },
        createdAt: expect.any(Date),
      });
    });
  });

  describe("getBidUpdates", () => {
    it("should return bid updates for session", async () => {
      const mockUpdates = [
        {
          id: "update-001",
          session_id: "session-001",
          vendor_org_id: "vendor-001",
          event_type: "new_bid",
          event_data: { amount: 1000 },
          created_at: new Date().toISOString(),
        },
        {
          id: "update-002",
          session_id: "session-001",
          vendor_org_id: "vendor-002",
          event_type: "bid_improved",
          event_data: { amount: 950 },
          created_at: new Date().toISOString(),
        },
      ];

      pool.query.mockResolvedValue({ rows: mockUpdates, rowCount: 2 });

      const result = await liveTenderingService.getBidUpdates("session-001");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        sessionId: "session-001",
        vendorOrgId: "vendor-001",
        eventType: "new_bid",
      });
    });
  });

  describe("publishSessionEvent", () => {
    it("should publish session event to Redis", async () => {
      (redisClient.publish as jest.Mock).mockResolvedValue(1);

      await liveTenderingService.publishSessionEvent(
        "session-001",
        "session_started",
        { startTime: new Date().toISOString() },
      );

      // Service publishes to channel "live_session:{sessionId}" with event object containing type/sessionId/eventType/data/timestamp
      expect(redisClient.publish).toHaveBeenCalledWith(
        "live_session:session-001",
        expect.stringContaining('"eventType":"session_started"'),
      );
    });
  });

  describe("publishBidEvent", () => {
    it("should publish bid event to Redis", async () => {
      (redisClient.publish as jest.Mock).mockResolvedValue(1);

      await liveTenderingService.publishBidEvent("session-001", "new_bid", {
        vendorId: "vendor-001",
        amount: 1000,
      });

      // Service publishes to channel "live_session:{sessionId}" with bid event object
      expect(redisClient.publish).toHaveBeenCalledWith(
        "live_session:session-001",
        expect.stringContaining('"eventType":"new_bid"'),
      );
    });
  });

  describe("getActiveSessions", () => {
    it("should return all active sessions", async () => {
      const mockSessions = [
        {
          id: "session-001",
          tender_id: "tender-001",
          status: "active",
          bidding_type: "open_reverse",
          scheduled_start: new Date().toISOString(),
          scheduled_end: new Date().toISOString(),
          total_bids_submitted: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "session-002",
          tender_id: "tender-002",
          status: "active",
          bidding_type: "open_auction",
          scheduled_start: new Date().toISOString(),
          scheduled_end: new Date().toISOString(),
          total_bids_submitted: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      pool.query.mockResolvedValue({ rows: mockSessions, rowCount: 2 });

      const result = await liveTenderingService.getActiveSessions();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe("active");
      expect(result[1].status).toBe("active");
    });

    it("should return empty array when no active sessions", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await liveTenderingService.getActiveSessions();

      expect(result).toEqual([]);
    });
  });

  describe("cleanupExpiredSessions", () => {
    it("should cancel expired scheduled sessions", async () => {
      // Service runs a single UPDATE query with no parameters (SQL literals only)
      pool.query.mockResolvedValueOnce({ rowCount: 2 });

      await liveTenderingService.cleanupExpiredSessions();

      // No array param - service uses SQL literals (WHERE status = 'scheduled' AND ... < NOW() - INTERVAL '1 hour')
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'scheduled'"),
      );
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when no expired sessions", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await liveTenderingService.cleanupExpiredSessions();

      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });
});
