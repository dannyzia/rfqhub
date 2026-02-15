import { Request, Response, NextFunction } from 'express';
import { addendumService } from '../services/addendum.service';
import type { CreateAddendumInput } from '../schemas/addendum.schema';

export const addendumController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as CreateAddendumInput;
      const addendum = await addendumService.create(tenderId, input, req.user!.id, req.user!.orgId);
      res.status(201).json({ data: addendum });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const addenda = await addendumService.findByTenderId(tenderId);
      res.status(200).json({ data: addenda });
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { addendumId } = req.params;
      const addendum = await addendumService.findById(addendumId);

      if (!addendum) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Addendum not found' } });
        return;
      }

      const acknowledgements = await addendumService.getAcknowledgementStatus(addendumId);
      res.status(200).json({ data: { ...addendum, acknowledgements } });
    } catch (err) {
      next(err);
    }
  },

  async acknowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { addendumId } = req.params;
      const acknowledgement = await addendumService.acknowledge(addendumId, req.user!.orgId, req.user!.id);
      res.status(200).json({ data: acknowledgement });
    } catch (err) {
      next(err);
    }
  },

  async getMyUnacknowledged(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const addenda = await addendumService.getUnacknowledgedByVendor(tenderId, req.user!.orgId);
      res.status(200).json({ data: addenda });
    } catch (err) {
      next(err);
    }
  },
};
