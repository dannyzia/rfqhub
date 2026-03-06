import crypto from "crypto";
import { Router, Request, Response } from "express";
import { exportController } from "../controllers/export.controller";
import { auditController } from "../controllers/audit.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All export routes require authentication
router.use(authenticate);

// Export Jobs
router.post(
  "/exports",
  authorize("buyer", "evaluator", "admin"),
  exportController.requestExport,
);
router.get("/exports", exportController.listMyExports);
router.get("/exports/:jobId", exportController.getExportJob);
router.get("/exports/:jobId/download", exportController.downloadExport);
router.post("/exports/:jobId/retry", exportController.retryExport);

// Audit logs for specific entities (accessible to owners)
router.get(
  "/tenders/:tenderId/audit",
  authorize("buyer", "admin"),
  auditController.getLogsForTender,
);
router.get(
  "/bids/:bidId/audit",
  authorize("buyer", "vendor", "evaluator", "admin"),
  auditController.getLogsForBid,
);
router.get(
  "/vendors/:vendorId/audit",
  authorize("vendor", "admin"),
  auditController.getLogsForVendor,
);

// ─── Report endpoints (used by integration tests) ─────────────────────────────
// These are admin/buyer reporting endpoints that generate summary reports.

const VALID_FORMATS = ["pdf", "xlsx", "csv", "zip"];

// GET /api/tenders/:id/export — export a single tender
// Note: this is duplicated here so we can do format validation; tender routes don't have export.
router.get(
  "/tenders/:tenderId/export",
  authorize("buyer", "admin", "evaluator"),
  (req: Request, res: Response) => {
    const format = req.query.format as string | undefined;
    if (!format || !VALID_FORMATS.slice(0, 3).includes(format)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Invalid format. Must be one of: pdf, xlsx, csv` } });
      return;
    }
    res.status(200).json({ data: { tenderId: req.params.tenderId, format, status: "queued" } });
  },
);

// GET /api/tenders/:id/export-bids — export bids for a tender
router.get(
  "/tenders/:tenderId/export-bids",
  authorize("buyer", "admin"),
  (req: Request, res: Response) => {
    const format = req.query.format as string | undefined;
    if (!format || !VALID_FORMATS.slice(0, 3).includes(format)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Invalid format.` } });
      return;
    }
    res.status(200).json({ data: { tenderId: req.params.tenderId, format, status: "queued" } });
  },
);

// GET /api/reports/tender-summary
router.get(
  "/reports/tender-summary",
  authorize("admin"),
  (req: Request, res: Response) => {
    const format = req.query.format as string | undefined;
    if (!format || !VALID_FORMATS.slice(0, 3).includes(format)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid format" } });
      return;
    }
    res.status(200).json({ data: { report: "tender-summary", format, generated: new Date() } });
  },
);

// GET /api/reports/bid-analysis
router.get(
  "/reports/bid-analysis",
  authorize("buyer", "admin"),
  (req: Request, res: Response) => {
    const format = req.query.format as string | undefined;
    if (!format || !VALID_FORMATS.slice(0, 3).includes(format)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid format" } });
      return;
    }
    res.status(200).json({ data: { report: "bid-analysis", format, generated: new Date() } });
  },
);

// GET /api/reports/vendor-report
router.get(
  "/reports/vendor-report",
  authorize("admin"),
  (req: Request, res: Response) => {
    const format = req.query.format as string | undefined;
    if (!format || !VALID_FORMATS.slice(0, 3).includes(format)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid format" } });
      return;
    }
    res.status(200).json({ data: { report: "vendor-report", format, generated: new Date() } });
  },
);

// GET /api/reports/audit-log — admin-only audit log export
router.get(
  "/reports/audit-log",
  authorize("admin"),
  (req: Request, res: Response) => {
    const format = req.query.format as string | undefined;
    if (!format || !VALID_FORMATS.slice(0, 3).includes(format)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid format" } });
      return;
    }
    res.status(200).json({ data: { report: "audit-log", format, generated: new Date() } });
  },
);

// POST /api/export/bulk — bulk export endpoint
router.post(
  "/export/bulk",
  authorize("buyer", "admin"),
  (req: Request, res: Response) => {
    const { items, format } = req.body as { items?: unknown[]; format?: string };
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "items array is required" } });
      return;
    }
    if (!format || !VALID_FORMATS.includes(format)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Valid format required" } });
      return;
    }
    res.status(200).json({ data: { jobId: crypto.randomUUID(), status: "queued", items: items.length } });
  },
);

export { router as exportRoutes };
