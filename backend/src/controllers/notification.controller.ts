import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";

export const notificationController = {
  async getMyNotifications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const notifications = await notificationService.findByRecipientId(
        req.user!.id,
        limit,
        offset,
      );
      res.status(200).json({ data: notifications });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { notificationId } = req.params;
      await notificationService.markAsDelivered(notificationId);
      res
        .status(200)
        .json({ data: { message: "Notification marked as read" } });
    } catch (err) {
      next(err);
    }
  },

  async processPending(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const processed = await notificationService.processPendingNotifications();
      res.status(200).json({ data: { processed } });
    } catch (err) {
      next(err);
    }
  },
};
