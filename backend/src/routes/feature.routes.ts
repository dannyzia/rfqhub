import { Router } from "express";
import { featureController } from "../controllers/feature.controller";
import { authenticate, authorize, validate } from "../middleware";
import {
  createFeatureSchema,
  createOptionSchema,
} from "../schemas/feature.schema";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("buyer", "admin"),
  validate(createFeatureSchema),
  featureController.createFeature,
);
router.get("/", featureController.findAllGlobal);
router.get("/:id", featureController.findById);
router.post(
  "/:id/options",
  authorize("buyer", "admin"),
  validate(createOptionSchema),
  featureController.createOption,
);

export { router as featureRoutes };
