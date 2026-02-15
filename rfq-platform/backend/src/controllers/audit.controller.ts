import { Request, Response, NextFunction } from "express";
import { auditService } from "../services/audit.service";
import { auditFilterSchema } from "../schemas/audit.schema";

export const auditController = {
  async searchLogs(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Only admins can search all audit logs
      if (!req.user!.roles.includes("admin")) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "Admin access required" },
        });
        return;
      }

      const filter = auditFilterSchema.parse(req.query);
      const result = await auditService.searchLogs(filter);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getLogsForTender(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tenderId } = req.params;

      // Buyers can view logs for their own tenders, admins can view all
      // In production, add ownership check here
      const logs = await auditService.getLogsForEntity("tender", tenderId);

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  },

  async getLogsForBid(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { bidId } = req.params;

      // Vendors can view logs for their own bids, buyers for bids on their tenders
      // In production, add ownership check here
      const logs = await auditService.getLogsForEntity("bid", bidId);

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  },

  async getLogsForVendor(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { vendorId } = req.params;

      // Vendors can view their own logs, admins can view all
      const isOwnOrg = req.user!.orgId === vendorId;
      const isAdmin = req.user!.roles.includes("admin");

      if (!isOwnOrg && !isAdmin) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
        return;
      }

      const logs = await auditService.getLogsForEntity("vendor", vendorId);

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  },

  async getMyActivityLogs(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter = auditFilterSchema.parse(req.query);

      // Override filter to only show user's own activity
      const userFilter = {
        ...filter,
        actorId: req.user!.id,
      };

      const result = await auditService.searchLogs(userFilter);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getEntityTimeline(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { entityType, entityId } = req.params;

      // Validate entity type
      const validTypes = [
        "tender",
        "bid",
        "vendor",
        "user",
        "addendum",
        "clarification",
        "evaluation",
        "award",
        "export",
      ];
      if (!validTypes.includes(entityType)) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Invalid entity type" },
        });
        return;
      }

      const logs = await auditService.getLogsForEntity(
        entityType as
          | "tender"
          | "bid"
          | "vendor"
          | "user"
          | "addendum"
          | "clarification"
          | "evaluation"
          | "award"
          | "export",
        entityId,
      );

      // Transform logs into timeline format
      const timeline = logs.map((log) => ({
        id: log.id,
        action: log.action,
        actor: log.actorName || "System",
        timestamp: log.createdAt,
        details: log.metadata,
      }));

      res.json({ timeline });
    } catch (error) {
      next(error);
    }
  },
};
