import { v4 as uuidv4 } from "uuid";
import { pool, logger } from "../config";
import type {
  CreateNotificationInput,
  NotificationType,
  NotificationChannel,
} from "../schemas/notification.schema";

interface NotificationRow {
  id: string;
  tender_id: string | null;
  recipient_id: string;
  notification_type: string;
  channel: string;
  status: string;
  payload: Record<string, unknown> | null;
  sent_at: string | null;
  failed_reason: string | null;
  created_at: string;
}

const MAX_RETRIES = 3;
// Retry delays in milliseconds: 1min, 5min, 25min (for future use)
// const RETRY_DELAYS = [60000, 300000, 1500000];

export const notificationService = {
  async create(input: CreateNotificationInput): Promise<NotificationRow> {
    const id = uuidv4();

    const { rows } = await pool.query<NotificationRow>(
      "INSERT INTO notifications (id, tender_id, recipient_id, notification_type, channel, status, payload) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *",
      [
        id,
        input.tenderId || null,
        input.recipientId,
        input.notificationType,
        input.channel,
        input.payload || null,
      ],
    );

    logger.debug(
      "Notification created: " + id + " type: " + input.notificationType,
    );
    return rows[0];
  },

  async createBulk(
    recipientIds: string[],
    notificationType: NotificationType,
    channel: NotificationChannel,
    tenderId?: string,
    payload?: Record<string, unknown>,
  ): Promise<NotificationRow[]> {
    const notifications: NotificationRow[] = [];

    for (const recipientId of recipientIds) {
      const notification = await this.create({
        tenderId,
        recipientId,
        notificationType,
        channel,
        payload,
      });
      notifications.push(notification);
    }

    logger.info(
      "Bulk notifications created: count=" +
        notifications.length +
        " type=" +
        notificationType,
    );
    return notifications;
  },

  async findPending(limit: number = 50): Promise<NotificationRow[]> {
    const { rows } = await pool.query<NotificationRow>(
      "SELECT * FROM notifications WHERE status IN ('pending', 'retried') ORDER BY created_at ASC LIMIT $1",
      [limit],
    );
    return rows;
  },

  async findByRecipientId(
    recipientId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<NotificationRow[]> {
    const { rows } = await pool.query<NotificationRow>(
      "SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [recipientId, limit, offset],
    );
    return rows;
  },

  async markAsSent(notificationId: string): Promise<void> {
    await pool.query(
      "UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1",
      [notificationId],
    );
    logger.debug("Notification marked as sent: " + notificationId);
  },

  async markAsDelivered(notificationId: string): Promise<void> {
    await pool.query(
      "UPDATE notifications SET status = 'delivered' WHERE id = $1",
      [notificationId],
    );
  },

  async markAsFailed(
    notificationId: string,
    reason: string,
    retryCount: number,
  ): Promise<void> {
    if (retryCount < MAX_RETRIES) {
      await pool.query(
        "UPDATE notifications SET status = 'retried', failed_reason = $1 WHERE id = $2",
        [reason, notificationId],
      );
      logger.warn(
        "Notification failed, will retry: id=" +
          notificationId +
          " reason=" +
          reason +
          " retryCount=" +
          retryCount,
      );
    } else {
      await pool.query(
        "UPDATE notifications SET status = 'failed', failed_reason = $1 WHERE id = $2",
        [reason, notificationId],
      );
      logger.error(
        "Notification failed permanently: id=" +
          notificationId +
          " reason=" +
          reason,
      );
    }
  },

  async sendEmail(
    to: string,
    subject: string,
    _body: string,
  ): Promise<boolean> {
    logger.info(
      "Email would be sent (placeholder) to=" + to + " subject=" + subject,
    );
    return true;
  },

  async sendSms(to: string, _message: string): Promise<boolean> {
    logger.info("SMS would be sent (placeholder) to=" + to);
    return true;
  },

  async processNotification(notification: NotificationRow): Promise<void> {
    try {
      const recipient = await pool.query(
        "SELECT email, name FROM users WHERE id = $1",
        [notification.recipient_id],
      );

      if (recipient.rows.length === 0) {
        await this.markAsFailed(
          notification.id,
          "Recipient not found",
          MAX_RETRIES,
        );
        return;
      }

      const { email, name } = recipient.rows[0];
      const payload = notification.payload || {};

      let success = false;

      if (notification.channel === "email") {
        const subject = this.getEmailSubject(
          notification.notification_type,
          payload,
        );
        const emailBody = this.getEmailBody(
          notification.notification_type,
          payload,
          name,
        );
        success = await this.sendEmail(email, subject, emailBody);
      } else if (notification.channel === "sms") {
        const smsMessage = this.getSmsMessage(
          notification.notification_type,
          payload,
        );
        success = await this.sendSms(email, smsMessage);
      } else if (notification.channel === "in_app") {
        success = true;
      }

      if (success) {
        await this.markAsSent(notification.id);
      } else {
        await this.markAsFailed(notification.id, "Send failed", 0);
      }
    } catch (err) {
      const error = err as Error;
      await this.markAsFailed(notification.id, error.message, 0);
    }
  },

  async processPendingNotifications(): Promise<number> {
    const pending = await this.findPending(50);
    let processed = 0;

    for (const notification of pending) {
      await this.processNotification(notification);
      processed++;
    }

    if (processed > 0) {
      logger.info("Processed pending notifications: count=" + processed);
    }

    return processed;
  },

  getEmailSubject(type: string, payload: Record<string, unknown>): string {
    const subjects: Record<string, string> = {
      tender_published: "New Tender: " + (payload.tenderTitle || "Untitled"),
      invitation_sent:
        "Invitation: " + (payload.tenderTitle || "Tender Invitation"),
      addendum_published:
        "Addendum Published: " + (payload.tenderTitle || "Tender"),
      clarification_answered:
        "Your Question Answered: " + (payload.tenderTitle || "Tender"),
      deadline_reminder_3d:
        "Reminder: 3 Days Until Deadline - " +
        (payload.tenderTitle || "Tender"),
      deadline_reminder_1d:
        "URGENT: 1 Day Until Deadline - " + (payload.tenderTitle || "Tender"),
      bid_submitted:
        "Bid Submitted Successfully: " + (payload.tenderTitle || "Tender"),
      bid_opening: "Bids Opened: " + (payload.tenderTitle || "Tender"),
      tender_awarded:
        "Award Notification: " + (payload.tenderTitle || "Tender"),
      vendor_doc_expiry_30d:
        "Document Expiring Soon: " + (payload.documentType || "Document"),
      vendor_doc_expiry_7d:
        "URGENT: Document Expiring: " + (payload.documentType || "Document"),
    };
    return subjects[type] || "RFQ Buddy Notification";
  },

  getEmailBody(
    _type: string,
    payload: Record<string, unknown>,
    recipientName: string,
  ): string {
    return (
      "Dear " +
      recipientName +
      ",\\n\\n" +
      JSON.stringify(payload, null, 2) +
      "\\n\\nBest regards,\\nRFQ Buddy Team"
    );
  },

  getSmsMessage(_type: string, payload: Record<string, unknown>): string {
    return "RFQ Buddy: " + this.getEmailSubject(_type, payload);
  },

  async notifyTenderPublished(
    tenderId: string,
    tenderTitle: string,
  ): Promise<void> {
    const tender = await pool.query(
      "SELECT visibility FROM tenders WHERE id = $1",
      [tenderId],
    );

    if (tender.rows[0].visibility === "open") {
      const vendors = await pool.query(
        "SELECT u.id FROM users u JOIN vendor_profiles vp ON vp.organization_id = u.organization_id WHERE vp.status = 'approved' AND 'vendor' = ANY(u.roles)",
      );

      await this.createBulk(
        vendors.rows.map((v) => v.id),
        "tender_published",
        "in_app",
        tenderId,
        { tenderTitle, tenderId },
      );
    }
  },

  async notifyBidSubmitted(
    bidId: string,
    tenderId: string,
    vendorOrgId: string,
  ): Promise<void> {
    const tender = await pool.query(
      "SELECT title, buyer_org_id FROM tenders WHERE id = $1",
      [tenderId],
    );

    const vendorUsers = await pool.query(
      "SELECT id FROM users WHERE organization_id = $1 AND 'vendor' = ANY(roles)",
      [vendorOrgId],
    );

    await this.createBulk(
      vendorUsers.rows.map((u) => u.id),
      "bid_submitted",
      "in_app",
      tenderId,
      { tenderTitle: tender.rows[0].title, bidId },
    );

    const buyerUsers = await pool.query(
      "SELECT id FROM users WHERE organization_id = $1 AND 'buyer' = ANY(roles)",
      [tender.rows[0].buyer_org_id],
    );

    await this.createBulk(
      buyerUsers.rows.map((u) => u.id),
      "bid_submitted",
      "in_app",
      tenderId,
      { tenderTitle: tender.rows[0].title, bidId, vendorOrgId },
    );
  },
};
