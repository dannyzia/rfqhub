import { Request, Response, NextFunction } from "express";
import { bidService } from "../services/bid.service";
import type { UpdateBidInput } from "../schemas/bid.schema";

export const bidController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const bid = await bidService.create(tenderId, req.user!.orgId);
      res.status(201).json({ data: bid });
    } catch (err) {
      next(err);
    }
  },

  async getMyBid(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tenderId } = req.params;
      const bid = await bidService.findActiveBid(tenderId, req.user!.orgId);

      if (!bid) {
        res
          .status(404)
          .json({
            error: { code: "NOT_FOUND", message: "No active bid found" },
          });
        return;
      }

      const items = await bidService.findBidItems(bid.id);
      const envelopes = await bidService.findBidEnvelopes(bid.id);

      res.status(200).json({ data: { ...bid, items, envelopes } });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const input = req.body as UpdateBidInput;
      const bid = await bidService.update(bidId, input, req.user!.orgId);
      res.status(200).json({ data: bid });
    } catch (err) {
      next(err);
    }
  },

  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bidId } = req.params;
      const bid = await bidService.submit(bidId, req.user!.orgId);
      res.status(200).json({ data: bid });
    } catch (err) {
      next(err);
    }
  },

  async withdraw(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { bidId } = req.params;
      const bid = await bidService.withdraw(bidId, req.user!.orgId);
      res.status(200).json({ data: bid });
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
      const bids = await bidService.findByTenderId(tenderId);
      res.status(200).json({ data: bids });
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
      const { bidId } = req.params;
      const bid = await bidService.findById(bidId);

      if (!bid) {
        res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "Bid not found" } });
        return;
      }

      const isOwner = bid.vendor_org_id === req.user!.orgId;
      const isBuyer =
        req.user!.roles.includes("buyer") || req.user!.roles.includes("admin");

      if (!isOwner && !isBuyer) {
        res
          .status(403)
          .json({ error: { code: "FORBIDDEN", message: "Not authorized" } });
        return;
      }

      const items = await bidService.findBidItems(bid.id);
      const envelopes = await bidService.findBidEnvelopes(bid.id);

      if (!isOwner && isBuyer) {
        const technicalEnvelope = envelopes.find(
          (e) => e.envelope_type === "technical",
        );
        const commercialEnvelope = envelopes.find(
          (e) => e.envelope_type === "commercial",
        );

        const filteredItems = items.filter((item) => {
          if (item.envelope_type === "technical") {
            return technicalEnvelope?.is_open;
          }
          if (item.envelope_type === "commercial") {
            return commercialEnvelope?.is_open;
          }
          return false;
        });

        res
          .status(200)
          .json({ data: { ...bid, items: filteredItems, envelopes } });
        return;
      }

      res.status(200).json({ data: { ...bid, items, envelopes } });
    } catch (err) {
      next(err);
    }
  },
};
