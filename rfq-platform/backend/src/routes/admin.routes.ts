import { Router } from "express";
import { taxController } from "../controllers/tax.controller";
import { currencyController } from "../controllers/currency.controller";
import { auditController } from "../controllers/audit.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Tax Rules (Admin only)
router.post("/tax-rules", authorize("admin"), taxController.createTaxRule);
router.get("/tax-rules", authorize("admin", "buyer"), taxController.listTaxRules);
router.get(
  "/tax-rules/:taxRuleId",
  authorize("admin", "buyer"),
  taxController.getTaxRule,
);
router.put(
  "/tax-rules/:taxRuleId",
  authorize("admin"),
  taxController.updateTaxRule,
);
router.delete(
  "/tax-rules/:taxRuleId",
  authorize("admin"),
  taxController.deleteTaxRule,
);

// Currency Rates
router.post(
  "/currency/refresh",
  authorize("admin"),
  currencyController.refreshRates,
);
router.get("/currency/rates", currencyController.listRates);
router.get(
  "/currency/rates/:baseCurrency/:targetCurrency",
  currencyController.getRate,
);
router.get(
  "/currency/rates/:baseCurrency/:targetCurrency/age",
  currencyController.getRateAge,
);
router.post(
  "/currency/rates",
  authorize("admin"),
  currencyController.upsertRate,
);
router.post("/currency/convert", currencyController.convertCurrency);

// Audit Logs (Admin only for full search)
router.get("/audit/search", authorize("admin"), auditController.searchLogs);
router.get("/audit/my-activity", auditController.getMyActivityLogs);
router.get(
  "/audit/timeline/:entityType/:entityId",
  auditController.getEntityTimeline,
);

export { router as adminRoutes };
