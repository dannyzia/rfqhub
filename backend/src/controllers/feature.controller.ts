import { Request, Response, NextFunction } from "express";
import { featureService } from "../services/feature.service";
import type {
  CreateFeatureInput,
  CreateOptionInput,
  AttachFeatureInput,
} from "../schemas/feature.schema";

export const featureController = {
  async createFeature(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as CreateFeatureInput;
      const feature = await featureService.createFeature(input);
      res.status(201).json({ data: feature });
    } catch (err) {
      next(err);
    }
  },

  async findAllGlobal(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const features = await featureService.findAllGlobalFeatures();
      res.status(200).json({ data: features });
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
      const feature = await featureService.findFeatureById(id);

      if (!feature) {
        res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "Feature not found" } });
        return;
      }

      const options = await featureService.findOptionsByFeatureId(id);
      res.status(200).json({ data: { ...feature, options } });
    } catch (err) {
      next(err);
    }
  },

  async createOption(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as CreateOptionInput;
      const option = await featureService.createOption(id, input);
      res.status(201).json({ data: option });
    } catch (err) {
      next(err);
    }
  },

  async attachToItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tenderId, itemId } = req.params;
      const input = req.body as AttachFeatureInput;
      const user = req.user as any;
      const attachment = await featureService.attachToItem(
        tenderId,
        itemId,
        input,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(201).json({ data: attachment });
    } catch (err) {
      next(err);
    }
  },

  async findByItemId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { itemId } = req.params;
      const features = await featureService.findFeaturesByItemId(itemId);
      res.status(200).json({ data: features });
    } catch (err) {
      next(err);
    }
  },

  async detachFromItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tenderId, itemId, featureId } = req.params;
      const user = req.user as any;
      await featureService.detachFromItem(
        tenderId,
        itemId,
        featureId,
        user.companyId?.toString() || user.id.toString(),
      );
      res.status(200).json({ data: { message: "Feature detached" } });
    } catch (err) {
      next(err);
    }
  },
};
