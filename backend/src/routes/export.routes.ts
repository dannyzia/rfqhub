import { Router } from "express";
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

export { router as exportRoutes };
