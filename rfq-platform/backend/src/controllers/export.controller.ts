import { Request, Response, NextFunction } from "express";
import { exportService } from "../services/export.service";
import { auditService } from "../services/audit.service";
import { notificationService } from "../services/notification.service";
import {
  requestExportSchema,
  exportFilterSchema,
} from "../schemas/export.schema";
import { logger } from "../config";

export const exportController = {
  async requestExport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validated = requestExportSchema.parse(req.body);
      const userId = req.user!.id;

      // Validate permissions based on export type
      if (validated.exportType === "full_data_dump") {
        const isAdmin = req.user!.roles.includes("admin");
        if (!isAdmin) {
          res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "Only admins can request full data dumps",
            },
          });
          return;
        }
      }

      const job = await exportService.createExportJob(userId, validated);

      await auditService.log({
        actorId: userId,
        action: "EXPORT_REQUESTED",
        entityType: "export",
        entityId: job.id,
        metadata: {
          exportType: validated.exportType,
          format: validated.format,
        },
      });

      // Process export asynchronously
      setImmediate(async () => {
        try {
          await exportService.processExportJob(job.id);

          // Send notification when complete
          await notificationService.create({
            recipientId: userId,
            notificationType: "bid_submitted", // Reusing type, ideally add EXPORT_READY
            channel: "in_app",
            tenderId: job.id,
          });

          await auditService.log({
            actorId: null,
            action: "EXPORT_COMPLETED",
            entityType: "export",
            entityId: job.id,
          });
        } catch (error) {
          logger.error("Export processing failed", { jobId: job.id, error });
        }
      });

      res.status(202).json({
        message: "Export job created. You will be notified when it is ready.",
        job,
      });
    } catch (error) {
      next(error);
    }
  },

  async getExportJob(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await exportService.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Export job not found" },
        });
        return;
      }

      // Users can only view their own export jobs (unless admin)
      if (job.userId !== req.user!.id && !req.user!.roles.includes("admin")) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
        return;
      }

      res.json(job);
    } catch (error) {
      next(error);
    }
  },

  async listMyExports(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filter = exportFilterSchema.parse(req.query);
      const userId = req.user!.id;

      const result = await exportService.listUserJobs(userId, filter);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async downloadExport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await exportService.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Export job not found" },
        });
        return;
      }

      // Users can only download their own exports (unless admin)
      if (job.userId !== req.user!.id && !req.user!.roles.includes("admin")) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
        return;
      }

      if (job.status !== "completed" || !job.fileUrl) {
        res.status(400).json({
          error: {
            code: "BUSINESS_RULE_VIOLATION",
            message: "Export is not ready for download",
          },
        });
        return;
      }

      // In production, redirect to signed S3 URL or stream the file
      res.json({ downloadUrl: job.fileUrl });
    } catch (error) {
      next(error);
    }
  },

  async retryExport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await exportService.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Export job not found" },
        });
        return;
      }

      if (job.userId !== req.user!.id && !req.user!.roles.includes("admin")) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
        return;
      }

      if (job.status !== "failed") {
        res.status(400).json({
          error: {
            code: "BUSINESS_RULE_VIOLATION",
            message: "Only failed exports can be retried",
          },
        });
        return;
      }

      // Reset status and reprocess
      await exportService.updateJobStatus(jobId, "pending");

      setImmediate(async () => {
        try {
          await exportService.processExportJob(jobId);
        } catch (error) {
          logger.error("Export retry failed", { jobId, error });
        }
      });

      res.json({ message: "Export retry initiated" });
    } catch (error) {
      next(error);
    }
  },
};
