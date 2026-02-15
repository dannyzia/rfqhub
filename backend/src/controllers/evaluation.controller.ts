import { Request, Response, NextFunction } from 'express';
import { evaluationService } from '../services/evaluation.service';
import type { CreateEvaluationInput, UnlockCommercialInput } from '../schemas/evaluation.schema';

export const evaluationController = {
  async openTechnicalEnvelopes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const { bidIds } = req.body;
      await evaluationService.openTechnicalEnvelopes(tenderId, req.user!.orgId, req.user!.id, bidIds);
      res.status(200).json({ data: { message: 'Technical envelopes opened' } });
    } catch (err) {
      next(err);
    }
  },

  async unlockCommercialEnvelopes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as UnlockCommercialInput;
      await evaluationService.unlockCommercialEnvelopes(tenderId, req.user!.orgId, req.user!.id, input.bidIds);
      res.status(200).json({ data: { message: 'Commercial envelopes unlocked' } });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateEvaluationInput;
      const evaluation = await evaluationService.create(input, req.user!.id, req.user!.orgId);
      res.status(201).json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  },

  async calculateCommercialScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      await evaluationService.calculateCommercialScores(tenderId);
      res.status(200).json({ data: { message: 'Commercial scores calculated' } });
    } catch (err) {
      next(err);
    }
  },

  async findByBidId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const evaluation = await evaluationService.findByBidId(bidId);

      if (!evaluation) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Evaluation not found' } });
        return;
      }

      res.status(200).json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const evaluations = await evaluationService.findByTenderId(tenderId);
      res.status(200).json({ data: evaluations });
    } catch (err) {
      next(err);
    }
  },

  async getComparisonMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const matrix = await evaluationService.getComparisonMatrix(tenderId, req.user!.orgId);
      res.status(200).json({ data: matrix });
    } catch (err) {
      next(err);
    }
  },

  async getRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const ranking = await evaluationService.getRanking(tenderId, req.user!.orgId);
      res.status(200).json({ data: ranking });
    } catch (err) {
      next(err);
    }
  },
};
