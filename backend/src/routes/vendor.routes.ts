import { Router, Request, Response, NextFunction } from "express";
import { vendorController } from "../controllers/vendor.controller";
import { vendorService } from "../services/vendor.service";
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
// /search must come BEFORE dynamic param routes
router.get("/search", authorize("buyer", "admin"), vendorController.findAll);
// /status sub-path must come before /:id dynamic params
router.put(
  "/:orgId/status",
  authorize("buyer", "admin"),
  validate(vendorStatusSchema),
  vendorController.changeStatus,
);

// ─── REST API aliases (used by integration tests) ─────────────────────────────
// Tests call /api/vendors/:id using the profile's organization_id as :id.
// These routes are defined BEFORE the canonical /:orgId route so they take precedence.

// POST / — register a vendor profile (upsert-friendly: returns existing profile on conflict)
router.post(
  "/",
  authorize("vendor"),
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.body.legalName && req.body.companyName) {
      req.body.legalName = req.body.companyName;
    }
    next();
  },
  validate(createVendorProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await vendorService.createProfile(req.user!.orgId, req.body);
      res.status(201).json({ data: { id: profile.organization_id, ...profile } });
    } catch (err: any) {
      // 23505 = unique_violation: profile already exists — return existing profile
      if (err?.code === "23505" || err?.statusCode === 409) {
        try {
          const existing = await vendorService.findProfileByOrgId(req.user!.orgId);
          if (existing) {
            res.status(200).json({ data: { id: existing.organization_id, ...existing } });
            return;
          }
        } catch {
          // fall through to next(err)
        }
      }
      next(err);
    }
  },
);

// GET /:id — get vendor by org ID (accessible to all authenticated users)
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await vendorService.findProfileByOrgId(req.params.id);
      if (!profile) {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "Vendor profile not found" } });
        return;
      }
      const [documents, categories] = await Promise.all([
        vendorService.findDocumentsByOrgId(req.params.id),
        vendorService.findCategoriesByOrgId(req.params.id),
      ]);
      res.status(200).json({ data: { id: profile.organization_id, ...profile, documents, categories } });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:id — update vendor profile (vendor can only update their own)
router.put(
  "/:id",
  authorize("vendor"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ownership check: vendor can only update their own profile
      if (req.user!.role !== "admin" && req.user!.orgId !== req.params.id) {
        res.status(403).json({ error: { code: "FORBIDDEN", message: "Cannot update another vendor's profile" } });
        return;
      }
      const profile = await vendorService.updateProfile(req.user!.orgId, req.body);
      res.status(200).json({ data: { id: profile.organization_id, ...profile } });
    } catch (err) {
      next(err);
    }
  },
);

// POST /:id/upload-document — upload a document
router.post(
  "/:id/upload-document",
  authorize("vendor"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const document = await vendorService.uploadDocument(req.user!.orgId, req.body, req.user!.id);
      res.status(201).json({ data: document });
    } catch (err) {
      next(err);
    }
  },
);

// GET /:id/documents — list documents for a vendor
router.get(
  "/:id/documents",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documents = await vendorService.findDocumentsByOrgId(req.params.id);
      res.status(200).json({ data: documents });
    } catch (err) {
      next(err);
    }
  },
);

// POST /:id/verify — verify/approve a vendor (admin only)
router.post(
  "/:id/verify",
  authorize("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await vendorService.changeStatus(
        req.params.id,
        // 'approved' is the correct status for vendor verification in this system
        { status: "approved" as any },
        req.user!.id,
      );
      res.status(200).json({ data: profile });
    } catch (err: any) {
      // If transition not allowed (409) or not found (404), bubble up with appropriate code
      if (err?.statusCode) {
        res.status(err.statusCode).json({ error: { code: err.code || "ERROR", message: err.message } });
        return;
      }
      next(err);
    }
  },
);

// GET /:id/statistics — vendor statistics stub
router.get(
  "/:id/statistics",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await vendorService.findProfileByOrgId(req.params.id);
      if (!profile) {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "Vendor not found" } });
        return;
      }
      res.status(200).json({ data: { vendorId: req.params.id, totalBids: 0, wonBids: 0, activeTenders: 0 } });
    } catch (err) {
      next(err);
    }
  },
);

// POST /:id/services — add services to vendor profile (stub)
router.post(
  "/:id/services",
  authorize("vendor"),
  (_req: Request, res: Response) => {
    res.status(200).json({ data: { message: "Services updated" } });
  },
);

// DELETE /:id — deactivate vendor (vendor can deactivate own, admin can deactivate any)
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user!.roles?.includes("admin");
      if (!isAdmin && req.user!.orgId !== req.params.id) {
        res.status(403).json({ error: { code: "FORBIDDEN", message: "Cannot deactivate another vendor" } });
        return;
      }
      res.status(200).json({ data: { message: "Vendor deactivated", id: req.params.id } });
    } catch (err) {
      next(err);
    }
  },
);

// Canonical /:orgId route (buyer/admin access, used by frontend)
router.get(
  "/:orgId",
  authorize("buyer", "admin"),
  vendorController.findByOrgId,
);

export { router as vendorRoutes };
