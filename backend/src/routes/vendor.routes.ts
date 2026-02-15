import { Router } from "express";
import { vendorController } from "../controllers/vendor.controller";
import { authenticate, authorize, validate } from "../middleware";
import {
  createVendorProfileSchema,
  updateVendorProfileSchema,
  vendorStatusSchema,
  uploadDocumentSchema,
  addCategorySchema,
} from "../schemas/vendor.schema";

const router = Router();

router.use(authenticate);

router.post(
  "/profile",
  authorize("vendor"),
  validate(createVendorProfileSchema),
  vendorController.createProfile,
);
router.get("/profile", authorize("vendor"), vendorController.getMyProfile);
router.put(
  "/profile",
  authorize("vendor"),
  validate(updateVendorProfileSchema),
  vendorController.updateProfile,
);

router.post(
  "/profile/documents",
  authorize("vendor"),
  validate(uploadDocumentSchema),
  vendorController.uploadDocument,
);
router.delete(
  "/profile/documents/:documentId",
  authorize("vendor"),
  vendorController.deleteDocument,
);

router.post(
  "/profile/categories",
  authorize("vendor"),
  validate(addCategorySchema),
  vendorController.addCategory,
);
router.delete(
  "/profile/categories/:categoryId",
  authorize("vendor"),
  vendorController.removeCategory,
);

router.get("/", authorize("buyer", "admin"), vendorController.findAll);
router.get(
  "/:orgId",
  authorize("buyer", "admin"),
  vendorController.findByOrgId,
);
router.put(
  "/:orgId/status",
  authorize("buyer", "admin"),
  validate(vendorStatusSchema),
  vendorController.changeStatus,
);

export { router as vendorRoutes };
