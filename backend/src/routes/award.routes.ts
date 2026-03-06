import { Router } from "express";
import { awardController } from "../controllers/award.controller";
import { authenticate, authorize, validate } from "../middleware";
import { createAwardSchema, bulkAwardSchema } from "../schemas/award.schema";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Tender-context routes
router.post(
  "/tenders/:tenderId/awards",
  authorize("buyer", "admin"),
  validate(createAwardSchema),
  awardController.create,
);

router.post(
  "/tenders/:tenderId/awards/bulk",
  authorize("buyer", "admin"),
  validate(bulkAwardSchema),
  awardController.createBulk,
);

router.get(
  "/tenders/:tenderId/awards",
  authorize("buyer", "admin", "evaluator"),
  awardController.findByTenderId,
);

router.get(
  "/tenders/:tenderId/awards/summary",
  authorize("buyer", "admin", "evaluator"),
  awardController.getSummary,
);

router.post(
  "/tenders/:tenderId/awards/finalize",
  authorize("buyer", "admin"),
  awardController.finalize,
);

// Individual award routes
router.get("/awards/:awardId", awardController.findById);

export { router as awardRoutes };
