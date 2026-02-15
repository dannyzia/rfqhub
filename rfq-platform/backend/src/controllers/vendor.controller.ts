import { Request, Response, NextFunction } from "express";
import { vendorService } from "../services/vendor.service";
import type {
  CreateVendorProfileInput,
  UpdateVendorProfileInput,
  VendorStatusInput,
  UploadDocumentInput,
  AddCategoryInput,
} from "../schemas/vendor.schema";

export const vendorController = {
  async createProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as CreateVendorProfileInput;
      const profile = await vendorService.createProfile(req.user!.orgId, input);
      res.status(201).json({ data: profile });
    } catch (err) {
      next(err);
    }
  },

  async getMyProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await vendorService.findProfileByOrgId(req.user!.orgId);

      if (!profile) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Vendor profile not found" },
        });
        return;
      }

      const documents = await vendorService.findDocumentsByOrgId(
        req.user!.orgId,
      );
      const categories = await vendorService.findCategoriesByOrgId(
        req.user!.orgId,
      );

      res.status(200).json({ data: { ...profile, documents, categories } });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as UpdateVendorProfileInput;
      const profile = await vendorService.updateProfile(req.user!.orgId, input);
      res.status(200).json({ data: profile });
    } catch (err) {
      next(err);
    }
  },

  async findAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const profiles = await vendorService.findAllProfiles(status);
      res.status(200).json({ data: profiles });
    } catch (err) {
      next(err);
    }
  },

  async findByOrgId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { orgId } = req.params;
      const profile = await vendorService.findProfileByOrgId(orgId);

      if (!profile) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Vendor profile not found" },
        });
        return;
      }

      const documents = await vendorService.findDocumentsByOrgId(orgId);
      const categories = await vendorService.findCategoriesByOrgId(orgId);

      res.status(200).json({ data: { ...profile, documents, categories } });
    } catch (err) {
      next(err);
    }
  },

  async changeStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { orgId } = req.params;
      const input = req.body as VendorStatusInput;
      const profile = await vendorService.changeStatus(
        orgId,
        input,
        req.user!.id,
      );
      res.status(200).json({ data: profile });
    } catch (err) {
      next(err);
    }
  },

  async uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as UploadDocumentInput;
      const document = await vendorService.uploadDocument(
        req.user!.orgId,
        input,
        req.user!.id,
      );
      res.status(201).json({ data: document });
    } catch (err) {
      next(err);
    }
  },

  async deleteDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { documentId } = req.params;
      await vendorService.deleteDocument(req.user!.orgId, documentId);
      res.status(200).json({ data: { message: "Document deleted" } });
    } catch (err) {
      next(err);
    }
  },

  async addCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as AddCategoryInput;
      const category = await vendorService.addCategory(req.user!.orgId, input);
      res.status(201).json({ data: category });
    } catch (err) {
      next(err);
    }
  },

  async removeCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryId } = req.params;
      await vendorService.removeCategory(req.user!.orgId, categoryId);
      res.status(200).json({ data: { message: "Category removed" } });
    } catch (err) {
      next(err);
    }
  },
};
