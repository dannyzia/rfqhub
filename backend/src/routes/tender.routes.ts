import { Router } from "express";
import { tenderController } from "../controllers/tender.controller";
import { itemController } from "../controllers/item.controller";
import { featureController } from "../controllers/feature.controller";
import { authenticate, authorize, validate } from "../middleware";
import {
  createTenderSchema,
  updateTenderSchema,
  publishTenderSchema,
} from "../schemas/tender.schema";
import { createItemSchema, updateItemSchema } from "../schemas/item.schema";
import { attachFeatureSchema } from "../schemas/feature.schema";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("buyer", "admin"),
  validate(createTenderSchema),
  tenderController.create,
);
router.get("/", tenderController.findAll);
router.get("/:id", tenderController.findById);
router.put(
  "/:id",
  authorize("buyer", "admin"),
  validate(updateTenderSchema),
  tenderController.update,
);
router.post(
  "/:id/publish",
  authorize("buyer", "admin"),
  validate(publishTenderSchema),
  tenderController.publish,
);
router.post(
  "/:id/cancel",
  authorize("buyer", "admin"),
  tenderController.cancel,
);

router.post(
  "/:tenderId/items",
  authorize("buyer", "admin"),
  validate(createItemSchema),
  itemController.create,
);
router.get("/:tenderId/items", itemController.findByTenderId);
router.get("/:tenderId/items/:id", itemController.findById);
router.put(
  "/:tenderId/items/:id",
  authorize("buyer", "admin"),
  validate(updateItemSchema),
  itemController.update,
);
router.delete(
  "/:tenderId/items/:id",
  authorize("buyer", "admin"),
  itemController.delete,
);

router.post(
  "/:tenderId/items/:itemId/features",
  authorize("buyer", "admin"),
  validate(attachFeatureSchema),
  featureController.attachToItem,
);
router.get("/:tenderId/items/:itemId/features", featureController.findByItemId);
router.delete(
  "/:tenderId/items/:itemId/features/:featureId",
  authorize("buyer", "admin"),
  featureController.detachFromItem,
);

export { router as tenderRoutes };
