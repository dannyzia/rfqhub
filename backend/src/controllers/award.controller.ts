import { Request, Response, NextFunction } from "express";
import { awardService } from "../services/award.service";
import type { CreateAwardInput, BulkAwardInput } from "../schemas/award.schema";

export const awardController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as CreateAwardInput;
      const award = await awardService.create(tenderId, input, req.user!.id, req.user!.orgId);
      res.status(201).json({ data: award });
    } catch (err) {
      next(err);
    }
  },

  async createBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as BulkAwardInput;
      const awards = await awardService.createBulk(tenderId, input.awards, req.user!.id, req.user!.orgId);
      res.status(201).json({ data: awards });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const awards = await awardService.findByTenderId(tenderId);
      res.status(200).json({ data: awards });
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { awardId } = req.params;
      const award = await awardService.findById(awardId);

      if (!award) {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "Award not found" } });
        return;
      }

      res.status(200).json({ data: award });
    } catch (err) {
      next(err);
    }
  },

  async finalize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      await awardService.finalizeTender(tenderId, req.user!.orgId);
      res.status(200).json({ data: { message: "Tender awarded successfully" } });
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const summary = await awardService.getAwardSummary(tenderId);
      res.status(200).json({ data: summary });
    } catch (err) {
      next(err);
    }
  },
};
