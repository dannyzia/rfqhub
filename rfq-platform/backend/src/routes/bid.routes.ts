import { Router } from "express";
import { bidController } from "../controllers/bid.controller";
import { authenticate, authorize, validate } from "../middleware";
import { updateBidSchema, submitBidSchema } from "../schemas/bid.schema";

const router = Router();

router.use(authenticate);

router.post(
  "/tenders/:tenderId/bids",
  authorize("vendor"),
  bidController.create,
);
router.get(
  "/tenders/:tenderId/bids/my",
  authorize("vendor"),
  bidController.getMyBid,
);
router.get(
  "/tenders/:tenderId/bids",
  authorize("buyer", "admin", "evaluator"),
  bidController.findByTenderId,
);

router.get("/bids/:bidId", bidController.findById);
router.put(
  "/bids/:bidId",
  authorize("vendor"),
  validate(updateBidSchema),
  bidController.update,
);
router.post(
  "/bids/:bidId/submit",
  authorize("vendor"),
  validate(submitBidSchema),
  bidController.submit,
);
router.post("/bids/:bidId/withdraw", authorize("vendor"), bidController.withdraw);

export { router as bidRoutes };
