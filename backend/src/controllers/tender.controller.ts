import { Request, Response, NextFunction } from "express";
import { tenderService } from "../services/tender.service";
import type {
  CreateTenderInput,
  UpdateTenderInput,
  PublishTenderInput,
} from "../schemas/tender.schema";

export const tenderController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateTenderInput;
      const user = req.user as any;
      const tender = await tenderService.create(
        input,
        user.id.toString(),
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(201).json({ data: tender });
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
      const user = req.user as any;
      const role =
        user.role === "buyer" || user.role === "admin" ? "buyer" : "vendor";
      const tenders = await tenderService.findAll(
        user.companyId?.toString() || user.id.toString(),
        role,
      );
      res.status(200).json({ data: tenders });
    } catch (err) {
      next(err);
    }
  },

  async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const tender = await tenderService.findById(id);

      if (!tender) {
        res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "Tender not found" } });
        return;
      }

      const isOwner =
        tender.buyer_org_id === user.companyId?.toString() ||
        user.id.toString();
      const isVendor = user.role === "vendor";

      if (isVendor && !isOwner) {
        const response = {
          ...tender,
          fund_allocation: undefined,
          estimated_cost: undefined,
        };
        res.status(200).json({ data: response });
        return;
      }

      res.status(200).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateTenderInput;
      const user = req.user as any;
      const tender = await tenderService.update(
        id,
        input,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(200).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },

  async publish(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as PublishTenderInput;
      const user = req.user as any;
      const tender = await tenderService.publish(
        id,
        user.companyId?.toString() || user.id.toString(),
        input.invitedVendorIds,
      );
      res.status(200).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const tender = await tenderService.cancel(
        id,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(200).json({ data: tender });
    } catch (err) {
      next(err);
    }
  },
};
