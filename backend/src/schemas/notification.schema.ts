import { z } from 'zod';

export const notificationTypeEnum = z.enum([
  'tender_published',
  'invitation_sent',
  'addendum_published',
  'addendum_unacknowledged',
  'clarification_answered',
  'deadline_reminder_3d',
  'deadline_reminder_1d',
  'bid_submitted',
  'bid_opening',
  'tender_awarded',
  'vendor_doc_expiry_30d',
  'vendor_doc_expiry_7d',
]);

export const notificationChannelEnum = z.enum(['email', 'sms', 'in_app']);

export const notificationStatusEnum = z.enum(['pending', 'sent', 'delivered', 'failed', 'retried']);

export const createNotificationSchema = z.object({
  tenderId: z.string().uuid().optional(),
  recipientId: z.string().uuid(),
  notificationType: notificationTypeEnum,
  channel: notificationChannelEnum,
  payload: z.record(z.unknown()).optional(),
});

export const updateNotificationStatusSchema = z.object({
  status: notificationStatusEnum,
  failedReason: z.string().max(500).optional(),
});

export const notificationFilterSchema = z.object({
  status: notificationStatusEnum.optional(),
  channel: notificationChannelEnum.optional(),
  type: notificationTypeEnum.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type NotificationType = z.infer<typeof notificationTypeEnum>;
export type NotificationChannel = z.infer<typeof notificationChannelEnum>;
export type NotificationStatus = z.infer<typeof notificationStatusEnum>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationStatusInput = z.infer<typeof updateNotificationStatusSchema>;
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
