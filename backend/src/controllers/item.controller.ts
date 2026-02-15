import { Request, Response, NextFunction } from "express";
import { itemService } from "../services/item.service";
import type { CreateItemInput, UpdateItemInput } from "../schemas/item.schema";

export const itemController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as CreateItemInput;
      const user = req.user as any;
      const item = await itemService.create(
        tenderId,
        input,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tenderId } = req.params;
      const tree = req.query.tree === "true";

      if (tree) {
        const items = await itemService.findByTenderIdAsTree(tenderId);
        res.status(200).json({ data: items });
      } else {
        const items = await itemService.findByTenderId(tenderId);

        const user = req.user as any;
        const isVendor =
          user.role === "vendor" &&
          !(user.role === "buyer" || user.role === "admin");
        if (isVendor) {
          const sanitized = items.map((item) => ({
            ...item,
            estimated_cost: undefined,
          }));
          res.status(200).json({ data: sanitized });
          return;
        }

        res.status(200).json({ data: items });
      }
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
      const { tenderId, id } = req.params;
      const item = await itemService.findById(tenderId, id);

      if (!item) {
        res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "Item not found" } });
        return;
      }

      res.status(200).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId, id } = req.params;
      const input = req.body as UpdateItemInput;
      const user = req.user as any;
      const item = await itemService.update(
        tenderId,
        id,
        input,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(200).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId, id } = req.params;
      const user = req.user as any;
      await itemService.delete(
        tenderId,
        id,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(200).json({ data: { message: "Item deleted" } });
    } catch (err) {
      next(err);
    }
  },
};
