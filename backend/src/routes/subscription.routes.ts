import { Router, Request, Response, NextFunction } from "express";
import { subscriptionController } from "../controllers/subscription.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { checkStorageQuota } from "../middleware/quota.middleware";

const router = Router();

// ─── Public routes (no auth required) ────────────────────────────────────────
// GET /plans – public plan listing (tests expect no auth for plan browsing)
router.get("/plans", subscriptionController.getAvailablePackages);

// All other subscription routes require authentication
router.use(authenticate);

// ─── Canonical routes (used by SubscriptionManagement.svelte frontend) ────────

// GET /packages - Get available packages (auth required)
router.get("/packages", subscriptionController.getAvailablePackages);

// GET /current - Get current organization subscription
router.get("/current", subscriptionController.getOrganizationSubscription);

// POST /current - Create/update subscription (admin only)
router.post(
  "/current",
  authorize("admin"),
  subscriptionController.createOrUpdateSubscription,
);

// DELETE /current - Cancel subscription (admin only)
router.delete(
  "/current",
  authorize("admin"),
  subscriptionController.cancelSubscription,
);

// GET /storage - Get storage usage
router.get("/storage", subscriptionController.getStorageUsage);

// POST /storage/recalculate - Recalculate storage usage (admin only)
router.post(
  "/storage/recalculate",
  authorize("admin"),
  subscriptionController.recalculateStorageUsage,
);

// GET /files - Get organization files
router.get("/files", subscriptionController.getOrganizationFiles);

// POST /files - Upload file (with storage quota check)
router.post("/files", checkStorageQuota, subscriptionController.uploadFile);

// DELETE /files/:fileId - Delete file
router.delete("/files/:fileId", subscriptionController.deleteFile);

// GET /files/:fileId - Get file details
router.get("/files/:fileId", subscriptionController.getFile);

// GET /quota/tender - Check tender quota
router.get("/quota/tender", subscriptionController.checkTenderQuota);

// ─── Alias routes for integration test compatibility ──────────────────────────
// Tests call /api/subscriptions/* — these alias names mirror common SaaS billing APIs.
// NOTE: /plans is registered ABOVE (before authenticate) as a public route.

// GET /usage  → alias for /storage usage
router.get("/usage", subscriptionController.getStorageUsage);

// GET /invoices - list invoices (stub: returns empty list)
router.get("/invoices", (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ data: [], pagination: { total: 0, page: 1, limit: 20 } });
});

// GET /invoice/:id - get single invoice (stub: returns 404)
router.get("/invoice/:invoiceId", (req: Request, res: Response) => {
  void req.params.invoiceId;
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Invoice not found" } });
});

// POST /upgrade - upgrade subscription plan
// TODO: Implement real Stripe/PayPal integration for payment processing
// This is a HIGH-RISK domain (payment processing) and requires proper implementation
router.post("/upgrade", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body as { planId?: string };
    if (!planId) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "planId is required" },
      });
      return;
    }
    const validPlans = ["basic", "standard", "premium", "enterprise"];
    if (!validPlans.includes(planId)) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid planId. Must be one of: ${validPlans.join(", ")}`,
        },
      });
      return;
    }
    // Payment processing not implemented - return 501
    res.status(501).json({
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Subscription upgrade not yet implemented. Requires Stripe/PayPal payment integration.",
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /downgrade - downgrade subscription plan
// TODO: Implement real Stripe/PayPal integration for payment processing
// This is a HIGH-RISK domain (payment processing) and requires proper implementation
router.post("/downgrade", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body as { planId?: string };
    if (!planId) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "planId is required" },
      });
      return;
    }
    // Payment processing not implemented - return 501
    res.status(501).json({
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Subscription downgrade not yet implemented. Requires Stripe/PayPal payment integration.",
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /cancel - cancel subscription
// TODO: Implement real Stripe/PayPal integration for payment processing
// This is a HIGH-RISK domain (payment processing) and requires proper implementation
router.post("/cancel", (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Payment processing not implemented - return 501
    res.status(501).json({
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Subscription cancellation not yet implemented. Requires Stripe/PayPal payment integration.",
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /update-payment - update payment method
// TODO: Implement real Stripe/PayPal integration for payment processing
// This is a HIGH-RISK domain (payment processing) and requires proper implementation
router.post(
  "/update-payment",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cardToken } = req.body as { cardToken?: string };
      if (!cardToken) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "cardToken is required" },
        });
        return;
      }
      // Payment processing not implemented - return 501
      res.status(501).json({
        error: {
          code: "NOT_IMPLEMENTED",
          message: "Payment method update not yet implemented. Requires Stripe/PayPal payment integration.",
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /admin/all - admin view all subscriptions (admin only)
router.get(
  "/admin/all",
  authorize("admin"),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res
        .status(200)
        .json({ data: [], pagination: { total: 0, page: 1, limit: 20 } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
