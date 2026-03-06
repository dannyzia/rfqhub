import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createLiveSession,
  getSessionByTenderId,
  getSessionById,
  startSession,
  endSession,
  cancelSession,
  getSessionBids,
  submitBid,
  checkVendorAccess,
} from "../controllers/liveTendering.controller";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// POST /api/live-sessions - Create live session
router.post("/sessions", createLiveSession);

// GET /api/live-sessions - List active sessions
// TODO: Implement list sessions endpoint in controller/service layer
router.get("/sessions", (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "List active sessions endpoint not yet implemented",
    },
  });
});

// GET /api/live-sessions/:tenderId - Get session by tender ID
router.get("/sessions/:tenderId", getSessionByTenderId);

// GET /api/live-sessions/:sessionId - Get session by session ID
router.get("/sessions/:sessionId", getSessionById);

// POST /api/live-sessions/:sessionId/start - Start session
router.post("/sessions/:sessionId/start", startSession);

// POST /api/live-sessions/:sessionId/end - End session
router.post("/sessions/:sessionId/end", endSession);

// POST /api/live-sessions/:sessionId/cancel - Cancel session
router.post("/sessions/:sessionId/cancel", cancelSession);

// GET /api/live-sessions/:sessionId/bids - Get session bids
router.get("/sessions/:sessionId/bids", getSessionBids);

// POST /api/live-sessions/bids - Submit live bid
router.post("/bids", submitBid);

// GET /api/live-sessions/:sessionId/access/:vendorOrgId - Check vendor access
router.get("/sessions/:sessionId/access/:vendorOrgId", checkVendorAccess);

// POST /api/live-sessions/:sessionId/join - Join session
// TODO: Implement join session functionality in controller/service layer
router.post("/sessions/:sessionId/join", (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Join session endpoint not yet implemented",
    },
  });
});

// POST /api/live-sessions/:sessionId/submit-bid - Submit live bid (legacy endpoint)
// Use POST /api/live-sessions/bids instead
router.post("/sessions/:sessionId/submit-bid", (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Use POST /api/live-sessions/bids endpoint instead",
    },
  });
});

// GET /api/live-sessions/:sessionId/participants - Get participants
// TODO: Implement get participants endpoint in controller/service layer
router.get("/sessions/:sessionId/participants", (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Get participants endpoint not yet implemented",
    },
  });
});

// POST /api/live-sessions/:sessionId/extend - Extend session
// TODO: Implement extend session functionality in controller/service layer
router.post("/sessions/:sessionId/extend", (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Extend session endpoint not yet implemented",
    },
  });
});

// SSE Stream endpoint for live tendering
// This is handled by streamSessionUpdates in controller
// Note: SSE endpoints should be handled separately from standard REST routes
router.get("/sessions/:sessionId/stream", (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "SSE stream endpoint not yet wired to routes",
    },
  });
});

export { router as liveTenderingRoutes };
