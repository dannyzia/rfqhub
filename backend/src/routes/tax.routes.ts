import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { taxController } from "../controllers/tax.controller";

const router = Router();

router.use(authenticate);

// ============================================================================
// TAX RATES ROUTES (new - jurisdiction-based with Redis caching)
// ============================================================================

// ─── GET /api/tax/rates?country=US&state=CA&taxType=VAT ─────────────────
// Returns tax rates for a jurisdiction (with caching via service layer)
router.get(
  "/rates",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.getTaxRateForJurisdiction(
        req,
        res,
        next,
      );

      // The controller handles the response
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/tax/jurisdictions ───────────────────────────────────────────────
// Returns list of supported tax jurisdictions
router.get(
  "/jurisdictions",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        data: [
          { country: "US", name: "United States" },
          { country: "GB", name: "United Kingdom" },
          { country: "DE", name: "Germany" },
          { country: "FR", name: "France" },
          { country: "AU", name: "Australia" },
          { country: "CA", name: "Canada" },
          { country: "BD", name: "Bangladesh" },
          { country: "IN", name: "India" },
          { country: "SG", name: "Singapore" },
          { country: "AE", name: "United Arab Emirates" },
        ],
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/tax/calculate ──────────────────────────────────────────────────
// Body: { amount, country, state?, taxType }
// Response: { data: { amount, taxAmount, totalAmount, taxRate } }
router.post(
  "/calculate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.calculateTax(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/tax/rates ───────────────────────────────────────────────────────
// Create a new tax rate
router.post(
  "/rates",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.createTaxRate(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/tax/rates/list ────────────────────────────────────────────────────
// List tax rates with optional filters
router.get(
  "/rates/list",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.listTaxRates(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/tax/rates/:taxRateId ─────────────────────────────────────────────
// Get a specific tax rate by ID
router.get(
  "/rates/:taxRateId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.getTaxRate(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── PUT /api/tax/rates/:taxRateId ─────────────────────────────────────────────
// Update a tax rate
router.put(
  "/rates/:taxRateId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.updateTaxRate(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /api/tax/rates/:taxRateId ────────────────────────────────────────────
// Delete a tax rate
router.delete(
  "/rates/:taxRateId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.deleteTaxRate(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// TAX RULES ROUTES (existing - procurement type-based)
// ============================================================================

// ─── POST /api/tax/rules ───────────────────────────────────────────────────────
// Create a new tax rule
router.post(
  "/rules",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.createTaxRule(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/tax/rules ────────────────────────────────────────────────────────
// List tax rules with optional filters
router.get(
  "/rules",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.listTaxRules(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/tax/rules/:taxRuleId ─────────────────────────────────────────────
// Get a specific tax rule by ID
router.get(
  "/rules/:taxRuleId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.getTaxRule(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── PUT /api/tax/rules/:taxRuleId ─────────────────────────────────────────────
// Update a tax rule
router.put(
  "/rules/:taxRuleId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.updateTaxRule(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /api/tax/rules/:taxRuleId ────────────────────────────────────────────
// Delete (deactivate) a tax rule
router.delete(
  "/rules/:taxRuleId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.deleteTaxRule(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/tax/bids/:bidId/calculate ────────────────────────────────────────
// Calculate taxes for a bid
router.post(
  "/bids/:bidId/calculate",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await taxController.calculateTaxesForBid(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

export { router as taxRoutes };
