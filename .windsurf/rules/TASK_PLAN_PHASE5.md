# PHASE 5: NOTIFICATIONS & ADDENDA
## Micro-Task Execution Plan with Tracking

> **FOR AI CODING AGENT**: Execute tasks IN ORDER. Mark status after each task.
> **PREREQUISITE**: Phase 1, 2, 3, and 4 must be 100% complete before starting Phase 5.

---

## SYSTEM PROMPT (Copy this to agent before starting)

```
You are a code-only execution agent. You will receive micro-tasks one at a time.

RULES:
1. Execute EXACTLY what is specified - no more, no less
2. Do NOT add features not requested
3. Do NOT refactor or "improve" existing code
4. If unclear, respond "BLOCKED: [reason]" and STOP
5. After completion, respond "✅ DONE" and wait for next task
6. Follow the code patterns in .rules/AGENT_RULES.md EXACTLY

CURRENT PHASE: Phase 5 - Notifications & Addenda
FILES ALREADY EXIST FROM PHASE 1, 2, 3 & 4 - DO NOT RECREATE THEM

You are now ready. Wait for Task 5.1.
```

---

## TASK TRACKING LEGEND

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |
| ❌ | Failed - needs retry |
| ⏸️ | Blocked - needs clarification |

---

# TASK 5.1: Create Notification Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.1: Create notification validation schema

Create file: rfq-platform/backend/src/schemas/notification.schema.ts

Content (copy EXACTLY):
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

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/notification.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 3 enums, 3 schemas, and 6 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.2: Create Clarification Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.2: Create clarification validation schema

Create file: rfq-platform/backend/src/schemas/clarification.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const createQuestionSchema = z.object({
  questionText: z.string().min(10).max(2000),
  isPublic: z.boolean().default(false),
});

export const answerQuestionSchema = z.object({
  answerText: z.string().min(1).max(5000),
  createsAddendum: z.boolean().default(false),
});

export const questionIdSchema = z.object({
  questionId: z.string().uuid(),
});

export const questionFilterSchema = z.object({
  status: z.enum(['open', 'answered', 'closed']).optional(),
  isPublic: z.boolean().optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;
export type QuestionIdInput = z.infer<typeof questionIdSchema>;
export type QuestionFilterInput = z.infer<typeof questionFilterSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/clarification.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 4 schemas and 4 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.3: Create Addendum Schema

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.3: Create addendum validation schema

Create file: rfq-platform/backend/src/schemas/addendum.schema.ts

Content (copy EXACTLY):
import { z } from 'zod';

export const createAddendumSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(10000),
  extendsDeadlineDays: z.number().int().min(0).max(90).optional(),
});

export const addendumIdSchema = z.object({
  addendumId: z.string().uuid(),
});

export const acknowledgeAddendumSchema = z.object({
  acknowledged: z.literal(true),
});

export type CreateAddendumInput = z.infer<typeof createAddendumSchema>;
export type AddendumIdInput = z.infer<typeof addendumIdSchema>;
export type AcknowledgeAddendumInput = z.infer<typeof acknowledgeAddendumSchema>;

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/schemas/addendum.schema.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports 3 schemas and 3 types

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.4: Create Notification Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.4: Create notification service

Create file: rfq-platform/backend/src/services/notification.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateNotificationInput, NotificationType, NotificationChannel } from '../schemas/notification.schema';

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
const RETRY_DELAYS = [60000, 300000, 1500000]; // 1min, 5min, 25min

export const notificationService = {
  async create(input: CreateNotificationInput): Promise<NotificationRow> {
    const id = uuidv4();

    const { rows } = await pool.query<NotificationRow>(
      `INSERT INTO notifications (id, tender_id, recipient_id, notification_type, channel, status, payload)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [id, input.tenderId || null, input.recipientId, input.notificationType, input.channel, input.payload || null]
    );

    logger.debug({ notificationId: id, type: input.notificationType }, 'Notification created');
    return rows[0];
  },

  async createBulk(
    recipientIds: string[],
    notificationType: NotificationType,
    channel: NotificationChannel,
    tenderId?: string,
    payload?: Record<string, unknown>
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

    logger.info({ count: notifications.length, type: notificationType }, 'Bulk notifications created');
    return notifications;
  },

  async findPending(limit: number = 50): Promise<NotificationRow[]> {
    const { rows } = await pool.query<NotificationRow>(
      `SELECT * FROM notifications 
       WHERE status IN ('pending', 'retried')
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },

  async findByRecipientId(recipientId: string, limit: number = 50, offset: number = 0): Promise<NotificationRow[]> {
    const { rows } = await pool.query<NotificationRow>(
      `SELECT * FROM notifications 
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [recipientId, limit, offset]
    );
    return rows;
  },

  async markAsSent(notificationId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
      [notificationId]
    );
    logger.debug({ notificationId }, 'Notification marked as sent');
  },

  async markAsDelivered(notificationId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET status = 'delivered' WHERE id = $1`,
      [notificationId]
    );
  },

  async markAsFailed(notificationId: string, reason: string, retryCount: number): Promise<void> {
    if (retryCount < MAX_RETRIES) {
      await pool.query(
        `UPDATE notifications SET status = 'retried', failed_reason = $1 WHERE id = $2`,
        [reason, notificationId]
      );
      logger.warn({ notificationId, reason, retryCount }, 'Notification failed, will retry');
    } else {
      await pool.query(
        `UPDATE notifications SET status = 'failed', failed_reason = $1 WHERE id = $2`,
        [reason, notificationId]
      );
      logger.error({ notificationId, reason }, 'Notification failed permanently');
    }
  },

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Placeholder for actual email sending
    // In production, use nodemailer, SendGrid, AWS SES, etc.
    logger.info({ to, subject }, 'Email would be sent (placeholder)');
    return true;
  },

  async sendSms(to: string, message: string): Promise<boolean> {
    // Placeholder for actual SMS sending
    // In production, use Twilio, AWS SNS, etc.
    logger.info({ to }, 'SMS would be sent (placeholder)');
    return true;
  },

  async processNotification(notification: NotificationRow): Promise<void> {
    try {
      const recipient = await pool.query(
        'SELECT email, name FROM users WHERE id = $1',
        [notification.recipient_id]
      );

      if (recipient.rows.length === 0) {
        await this.markAsFailed(notification.id, 'Recipient not found', MAX_RETRIES);
        return;
      }

      const { email, name } = recipient.rows[0];
      const payload = notification.payload || {};

      let success = false;

      if (notification.channel === 'email') {
        const subject = this.getEmailSubject(notification.notification_type, payload);
        const body = this.getEmailBody(notification.notification_type, payload, name);
        success = await this.sendEmail(email, subject, body);
      } else if (notification.channel === 'sms') {
        const message = this.getSmsMessage(notification.notification_type, payload);
        success = await this.sendSms(email, message); // Would use phone number in production
      } else if (notification.channel === 'in_app') {
        // In-app notifications are already stored, just mark as sent
        success = true;
      }

      if (success) {
        await this.markAsSent(notification.id);
      } else {
        await this.markAsFailed(notification.id, 'Send failed', 0);
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
      logger.info({ processed }, 'Processed pending notifications');
    }

    return processed;
  },

  getEmailSubject(type: string, payload: Record<string, unknown>): string {
    const subjects: Record<string, string> = {
      tender_published: `New Tender: ${payload.tenderTitle || 'Untitled'}`,
      invitation_sent: `You're Invited: ${payload.tenderTitle || 'Tender Invitation'}`,
      addendum_published: `Addendum Published: ${payload.tenderTitle || 'Tender'}`,
      clarification_answered: `Your Question Answered: ${payload.tenderTitle || 'Tender'}`,
      deadline_reminder_3d: `Reminder: 3 Days Until Deadline - ${payload.tenderTitle || 'Tender'}`,
      deadline_reminder_1d: `URGENT: 1 Day Until Deadline - ${payload.tenderTitle || 'Tender'}`,
      bid_submitted: `Bid Submitted Successfully: ${payload.tenderTitle || 'Tender'}`,
      bid_opening: `Bids Opened: ${payload.tenderTitle || 'Tender'}`,
      tender_awarded: `Award Notification: ${payload.tenderTitle || 'Tender'}`,
      vendor_doc_expiry_30d: `Document Expiring Soon: ${payload.documentType || 'Document'}`,
      vendor_doc_expiry_7d: `URGENT: Document Expiring: ${payload.documentType || 'Document'}`,
    };
    return subjects[type] || 'RFQ Buddy Notification';
  },

  getEmailBody(type: string, payload: Record<string, unknown>, recipientName: string): string {
    return `Dear ${recipientName},\n\n${JSON.stringify(payload, null, 2)}\n\nBest regards,\nRFQ Buddy Team`;
  },

  getSmsMessage(type: string, payload: Record<string, unknown>): string {
    return `RFQ Buddy: ${this.getEmailSubject(type, payload)}`;
  },

  async notifyTenderPublished(tenderId: string, tenderTitle: string): Promise<void> {
    const tender = await pool.query(
      'SELECT visibility FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows[0].visibility === 'open') {
      const vendors = await pool.query(
        `SELECT u.id FROM users u
         JOIN vendor_profiles vp ON vp.organization_id = u.organization_id
         WHERE vp.status = 'approved' AND 'vendor' = ANY(u.roles)`
      );

      await this.createBulk(
        vendors.rows.map(v => v.id),
        'tender_published',
        'in_app',
        tenderId,
        { tenderTitle, tenderId }
      );
    }
  },

  async notifyBidSubmitted(bidId: string, tenderId: string, vendorOrgId: string): Promise<void> {
    const tender = await pool.query(
      'SELECT title, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    const vendorUsers = await pool.query(
      `SELECT id FROM users WHERE organization_id = $1 AND 'vendor' = ANY(roles)`,
      [vendorOrgId]
    );

    await this.createBulk(
      vendorUsers.rows.map(u => u.id),
      'bid_submitted',
      'in_app',
      tenderId,
      { tenderTitle: tender.rows[0].title, bidId }
    );

    const buyerUsers = await pool.query(
      `SELECT id FROM users WHERE organization_id = $1 AND 'buyer' = ANY(roles)`,
      [tender.rows[0].buyer_org_id]
    );

    await this.createBulk(
      buyerUsers.rows.map(u => u.id),
      'bid_submitted',
      'in_app',
      tenderId,
      { tenderTitle: tender.rows[0].title, bidId, vendorOrgId }
    );
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/notification.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `notificationService` object
- [ ] Has create, processPending, and notify helper methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.5: Create Clarification Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.5: Create clarification service

Create file: rfq-platform/backend/src/services/clarification.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateQuestionInput, AnswerQuestionInput } from '../schemas/clarification.schema';

interface QuestionRow {
  id: string;
  tender_id: string;
  vendor_org_id: string;
  question_text: string;
  is_public: boolean;
  status: string;
  created_at: string;
}

interface AnswerRow {
  id: string;
  question_id: string;
  buyer_user_id: string;
  answer_text: string;
  creates_addendum: boolean;
  answered_at: string;
}

export const clarificationService = {
  async createQuestion(tenderId: string, vendorOrgId: string, input: CreateQuestionInput): Promise<QuestionRow> {
    const tender = await pool.query(
      'SELECT id, status FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].status !== 'published' && tender.rows[0].status !== 'clarification') {
      throw Object.assign(new Error('Questions can only be asked on published tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    const id = uuidv4();

    const { rows } = await pool.query<QuestionRow>(
      `INSERT INTO clarification_questions (id, tender_id, vendor_org_id, question_text, is_public, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING *`,
      [id, tenderId, vendorOrgId, input.questionText, input.isPublic]
    );

    if (tender.rows[0].status === 'published') {
      await pool.query(
        `UPDATE tenders SET status = 'clarification', updated_at = NOW() WHERE id = $1`,
        [tenderId]
      );
    }

    logger.info({ questionId: id, tenderId, vendorOrgId }, 'Clarification question created');
    return rows[0];
  },

  async findQuestionById(questionId: string): Promise<QuestionRow | null> {
    const { rows } = await pool.query<QuestionRow>(
      'SELECT * FROM clarification_questions WHERE id = $1',
      [questionId]
    );
    return rows[0] || null;
  },

  async findQuestionsByTenderId(tenderId: string, vendorOrgId?: string, isPublic?: boolean): Promise<QuestionRow[]> {
    let query = 'SELECT * FROM clarification_questions WHERE tender_id = $1';
    const params: (string | boolean)[] = [tenderId];
    let paramIndex = 2;

    if (vendorOrgId) {
      query += ` AND (vendor_org_id = $${paramIndex} OR is_public = true)`;
      params.push(vendorOrgId);
      paramIndex++;
    }

    if (isPublic !== undefined) {
      query += ` AND is_public = $${paramIndex}`;
      params.push(isPublic);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query<QuestionRow>(query, params);
    return rows;
  },

  async answerQuestion(questionId: string, buyerUserId: string, orgId: string, input: AnswerQuestionInput): Promise<AnswerRow> {
    const question = await this.findQuestionById(questionId);

    if (!question) {
      throw Object.assign(new Error('Question not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const tender = await pool.query(
      'SELECT buyer_org_id FROM tenders WHERE id = $1',
      [question.tender_id]
    );

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (question.status !== 'open') {
      throw Object.assign(new Error('Question is already answered'), { statusCode: 409, code: 'CONFLICT' });
    }

    const id = uuidv4();

    const { rows } = await pool.query<AnswerRow>(
      `INSERT INTO clarification_answers (id, question_id, buyer_user_id, answer_text, creates_addendum)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, questionId, buyerUserId, input.answerText, input.createsAddendum]
    );

    await pool.query(
      `UPDATE clarification_questions SET status = 'answered' WHERE id = $1`,
      [questionId]
    );

    const openQuestions = await pool.query(
      `SELECT COUNT(*) as count FROM clarification_questions WHERE tender_id = $1 AND status = 'open'`,
      [question.tender_id]
    );

    if (parseInt(openQuestions.rows[0].count) === 0) {
      await pool.query(
        `UPDATE tenders SET status = 'published', updated_at = NOW() WHERE id = $1 AND status = 'clarification'`,
        [question.tender_id]
      );
    }

    logger.info({ answerId: id, questionId, createsAddendum: input.createsAddendum }, 'Question answered');
    return rows[0];
  },

  async findAnswerByQuestionId(questionId: string): Promise<AnswerRow | null> {
    const { rows } = await pool.query<AnswerRow>(
      'SELECT * FROM clarification_answers WHERE question_id = $1',
      [questionId]
    );
    return rows[0] || null;
  },

  async getQuestionsWithAnswers(tenderId: string, vendorOrgId?: string): Promise<(QuestionRow & { answer?: AnswerRow })[]> {
    const questions = await this.findQuestionsByTenderId(tenderId, vendorOrgId);
    
    const result = [];
    for (const question of questions) {
      const answer = await this.findAnswerByQuestionId(question.id);
      result.push({ ...question, answer: answer || undefined });
    }

    return result;
  },

  async closeQuestion(questionId: string, orgId: string): Promise<void> {
    const question = await this.findQuestionById(questionId);

    if (!question) {
      throw Object.assign(new Error('Question not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const tender = await pool.query(
      'SELECT buyer_org_id FROM tenders WHERE id = $1',
      [question.tender_id]
    );

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    await pool.query(
      `UPDATE clarification_questions SET status = 'closed' WHERE id = $1`,
      [questionId]
    );

    logger.info({ questionId }, 'Question closed');
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/clarification.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `clarificationService` object
- [ ] Has question and answer methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.6: Create Addendum Service

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.6: Create addendum service

Create file: rfq-platform/backend/src/services/addendum.service.ts

Content (copy EXACTLY):
import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateAddendumInput } from '../schemas/addendum.schema';

interface AddendumRow {
  id: string;
  tender_id: string;
  addendum_number: number;
  title: string;
  description: string;
  extends_deadline_days: number | null;
  published_at: string;
  published_by: string;
}

interface AcknowledgementRow {
  addendum_id: string;
  vendor_org_id: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export const addendumService = {
  async create(tenderId: string, input: CreateAddendumInput, userId: string, orgId: string): Promise<AddendumRow> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id, submission_deadline FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const allowedStatuses = ['published', 'clarification'];
    if (!allowedStatuses.includes(tender.rows[0].status)) {
      throw Object.assign(new Error('Addenda can only be added to published tenders'), { statusCode: 409, code: 'CONFLICT' });
    }

    const maxNumber = await pool.query(
      'SELECT COALESCE(MAX(addendum_number), 0) as max FROM addenda WHERE tender_id = $1',
      [tenderId]
    );
    const addendumNumber = maxNumber.rows[0].max + 1;

    const id = uuidv4();

    const { rows } = await pool.query<AddendumRow>(
      `INSERT INTO addenda (id, tender_id, addendum_number, title, description, extends_deadline_days, published_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, tenderId, addendumNumber, input.title, input.description, input.extendsDeadlineDays || null, userId]
    );

    if (input.extendsDeadlineDays && input.extendsDeadlineDays > 0) {
      await pool.query(
        `UPDATE tenders 
         SET submission_deadline = submission_deadline + INTERVAL '1 day' * $1,
             updated_at = NOW()
         WHERE id = $2`,
        [input.extendsDeadlineDays, tenderId]
      );
      logger.info({ tenderId, extensionDays: input.extendsDeadlineDays }, 'Tender deadline extended');
    }

    if (tender.rows[0].status === 'open') {
      const vendors = await pool.query(
        `SELECT DISTINCT vp.organization_id FROM vendor_profiles vp WHERE vp.status = 'approved'`
      );
      
      for (const vendor of vendors.rows) {
        await pool.query(
          `INSERT INTO addendum_acknowledgements (addendum_id, vendor_org_id)
           VALUES ($1, $2)
           ON CONFLICT (addendum_id, vendor_org_id) DO NOTHING`,
          [id, vendor.organization_id]
        );
      }
    } else {
      const invitations = await pool.query(
        `SELECT vendor_org_id FROM tender_vendor_invitations WHERE tender_id = $1`,
        [tenderId]
      );

      for (const inv of invitations.rows) {
        await pool.query(
          `INSERT INTO addendum_acknowledgements (addendum_id, vendor_org_id)
           VALUES ($1, $2)
           ON CONFLICT (addendum_id, vendor_org_id) DO NOTHING`,
          [id, inv.vendor_org_id]
        );
      }
    }

    logger.info({ addendumId: id, tenderId, addendumNumber }, 'Addendum created');
    return rows[0];
  },

  async findById(addendumId: string): Promise<AddendumRow | null> {
    const { rows } = await pool.query<AddendumRow>(
      'SELECT * FROM addenda WHERE id = $1',
      [addendumId]
    );
    return rows[0] || null;
  },

  async findByTenderId(tenderId: string): Promise<AddendumRow[]> {
    const { rows } = await pool.query<AddendumRow>(
      'SELECT * FROM addenda WHERE tender_id = $1 ORDER BY addendum_number ASC',
      [tenderId]
    );
    return rows;
  },

  async acknowledge(addendumId: string, vendorOrgId: string, userId: string): Promise<AcknowledgementRow> {
    const addendum = await this.findById(addendumId);

    if (!addendum) {
      throw Object.assign(new Error('Addendum not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const existing = await pool.query(
      'SELECT * FROM addendum_acknowledgements WHERE addendum_id = $1 AND vendor_org_id = $2',
      [addendumId, vendorOrgId]
    );

    if (existing.rows.length === 0) {
      throw Object.assign(new Error('Vendor not eligible for this addendum'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (existing.rows[0].acknowledged_at) {
      return existing.rows[0] as AcknowledgementRow;
    }

    const { rows } = await pool.query<AcknowledgementRow>(
      `UPDATE addendum_acknowledgements 
       SET acknowledged_at = NOW(), acknowledged_by = $1
       WHERE addendum_id = $2 AND vendor_org_id = $3
       RETURNING *`,
      [userId, addendumId, vendorOrgId]
    );

    logger.info({ addendumId, vendorOrgId, userId }, 'Addendum acknowledged');
    return rows[0];
  },

  async getAcknowledgementStatus(addendumId: string): Promise<AcknowledgementRow[]> {
    const { rows } = await pool.query<AcknowledgementRow>(
      `SELECT aa.*, o.name as vendor_name
       FROM addendum_acknowledgements aa
       JOIN organizations o ON o.id = aa.vendor_org_id
       WHERE aa.addendum_id = $1`,
      [addendumId]
    );
    return rows;
  },

  async getUnacknowledgedByVendor(tenderId: string, vendorOrgId: string): Promise<AddendumRow[]> {
    const { rows } = await pool.query<AddendumRow>(
      `SELECT a.* FROM addenda a
       JOIN addendum_acknowledgements aa ON aa.addendum_id = a.id
       WHERE a.tender_id = $1 
         AND aa.vendor_org_id = $2 
         AND aa.acknowledged_at IS NULL
       ORDER BY a.addendum_number ASC`,
      [tenderId, vendorOrgId]
    );
    return rows;
  },

  async hasUnacknowledgedAddenda(tenderId: string, vendorOrgId: string): Promise<boolean> {
    const unacknowledged = await this.getUnacknowledgedByVendor(tenderId, vendorOrgId);
    return unacknowledged.length > 0;
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/services/addendum.service.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `addendumService` object
- [ ] Has create, acknowledge, and status methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.7: Create Notification Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.7: Create notification controller

Create file: rfq-platform/backend/src/controllers/notification.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

export const notificationController = {
  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const notifications = await notificationService.findByRecipientId(req.user!.id, limit, offset);
      res.status(200).json({ data: notifications });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notificationId } = req.params;
      await notificationService.markAsDelivered(notificationId);
      res.status(200).json({ data: { message: 'Notification marked as read' } });
    } catch (err) {
      next(err);
    }
  },

  async processPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const processed = await notificationService.processPendingNotifications();
      res.status(200).json({ data: { processed } });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/notification.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `notificationController` object
- [ ] Has getMyNotifications, markAsRead, processPending methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.8: Create Clarification Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.8: Create clarification controller

Create file: rfq-platform/backend/src/controllers/clarification.controller.ts

Content (copy EXACTLY):
import { Request, Response, NextFunction } from 'express';
import { clarificationService } from '../services/clarification.service';
import type { CreateQuestionInput, AnswerQuestionInput } from '../schemas/clarification.schema';

export const clarificationController = {
  async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const input = req.body as CreateQuestionInput;
      const question = await clarificationService.createQuestion(tenderId, req.user!.orgId, input);
      res.status(201).json({ data: question });
    } catch (err) {
      next(err);
    }
  },

  async answerQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      const input = req.body as AnswerQuestionInput;
      const answer = await clarificationService.answerQuestion(questionId, req.user!.id, req.user!.orgId, input);
      res.status(201).json({ data: answer });
    } catch (err) {
      next(err);
    }
  },

  async findByTenderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenderId } = req.params;
      const isVendor = req.user!.roles.includes('vendor') && !req.user!.roles.includes('buyer');
      const questions = await clarificationService.getQuestionsWithAnswers(
        tenderId,
        isVendor ? req.user!.orgId : undefined
      );
      res.status(200).json({ data: questions });
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      const question = await clarificationService.findQuestionById(questionId);

      if (!question) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Question not found' } });
        return;
      }

      const answer = await clarificationService.findAnswerByQuestionId(questionId);
      res.status(200).json({ data: { ...question, answer: answer || undefined } });
    } catch (err) {
      next(err);
    }
  },

  async closeQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      await clarificationService.closeQuestion(questionId, req.user!.orgId);
      res.status(200).json({ data: { message: 'Question closed' } });
    } catch (err) {
      next(err);
    }
  },
};

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/clarification.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `clarificationController` object
- [ ] Has question and answer methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.9: Create Addendum Controller

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.9: Create addendum controller

Create file: rfq-platform/backend/src/controllers/addendum.controller.ts

Content (copy EXACTLY):
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

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/controllers/addendum.controller.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `addendumController` object
- [ ] Has create, find, and acknowledge methods

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.10: Create Notification Routes

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.10: Create notification, clarification, and addendum routes

Create file: rfq-platform/backend/src/routes/notification.routes.ts

Content (copy EXACTLY):
import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { clarificationController } from '../controllers/clarification.controller';
import { addendumController } from '../controllers/addendum.controller';
import { authenticate, authorize, validate } from '../middleware';
import { createQuestionSchema, answerQuestionSchema } from '../schemas/clarification.schema';
import { createAddendumSchema, acknowledgeAddendumSchema } from '../schemas/addendum.schema';

const router = Router();

router.use(authenticate);

// Notifications
router.get('/notifications', notificationController.getMyNotifications);
router.put('/notifications/:notificationId/read', notificationController.markAsRead);
router.post('/notifications/process', authorize('admin'), notificationController.processPending);

// Clarifications
router.post('/tenders/:tenderId/questions', authorize('vendor'), validate(createQuestionSchema), clarificationController.createQuestion);
router.get('/tenders/:tenderId/questions', clarificationController.findByTenderId);
router.get('/questions/:questionId', clarificationController.findById);
router.post('/questions/:questionId/answer', authorize('buyer', 'admin'), validate(answerQuestionSchema), clarificationController.answerQuestion);
router.post('/questions/:questionId/close', authorize('buyer', 'admin'), clarificationController.closeQuestion);

// Addenda
router.post('/tenders/:tenderId/addenda', authorize('buyer', 'admin'), validate(createAddendumSchema), addendumController.create);
router.get('/tenders/:tenderId/addenda', addendumController.findByTenderId);
router.get('/tenders/:tenderId/addenda/unacknowledged', authorize('vendor'), addendumController.getMyUnacknowledged);
router.get('/addenda/:addendumId', addendumController.findById);
router.post('/addenda/:addendumId/acknowledge', authorize('vendor'), validate(acknowledgeAddendumSchema), addendumController.acknowledge);

export { router as notificationRoutes };

Respond "✅ DONE" when file is created.
```

### EXPECTED OUTPUT:
- File exists at `rfq-platform/backend/src/routes/notification.routes.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Exports `notificationRoutes`
- [ ] Has routes for notifications, clarifications, and addenda

### REMARKS:
```
[Agent writes completion notes here]
```

---

# TASK 5.11: Update Routes Index

**Status:** ⬜
**Assigned:** 
**Completed:** 

### PROMPT TO AGENT:
```
TASK 5.11: Update routes index to include notification routes

MODIFY file: rfq-platform/backend/src/routes/index.ts

Replace ENTIRE content with:
import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { tenderRoutes } from './tender.routes';
import { featureRoutes } from './feature.routes';
import { vendorRoutes } from './vendor.routes';
import { bidRoutes } from './bid.routes';
import { evaluationRoutes } from './evaluation.routes';
import { notificationRoutes } from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenders', tenderRoutes);
router.use('/features', featureRoutes);
router.use('/vendors', vendorRoutes);
router.use('/', bidRoutes);
router.use('/', evaluationRoutes);
router.use('/', notificationRoutes);

export { router as apiRoutes };

Respond "✅ DONE" when file is updated.
```

### EXPECTED OUTPUT:
- File updated at `rfq-platform/backend/src/routes/index.ts`

### VERIFICATION:
- [ ] File exists
- [ ] Mounts all 7 route modules

### REMARKS:
```
[Agent writes completion notes here]
```

---

# PHASE 5 COMPLETION CHECKLIST

| Task | File | Status |
|------|------|--------|
| 5.1 | schemas/notification.schema.ts | ⬜ |
| 5.2 | schemas/clarification.schema.ts | ⬜ |
| 5.3 | schemas/addendum.schema.ts | ⬜ |
| 5.4 | services/notification.service.ts | ⬜ |
| 5.5 | services/clarification.service.ts | ⬜ |
| 5.6 | services/addendum.service.ts | ⬜ |
| 5.7 | controllers/notification.controller.ts | ⬜ |
| 5.8 | controllers/clarification.controller.ts | ⬜ |
| 5.9 | controllers/addendum.controller.ts | ⬜ |
| 5.10 | routes/notification.routes.ts | ⬜ |
| 5.11 | routes/index.ts (update) | ⬜ |

---

## AFTER PHASE 5 COMPLETE

Run these commands to verify:

```bash
cd rfq-platform/backend
npm run build
```

If build succeeds with no errors, Phase 5 is complete.

**Test endpoints using Postman:**
1. Get my notifications: GET /api/notifications
2. Create question: POST /api/tenders/:id/questions
3. Answer question: POST /api/questions/:id/answer
4. Create addendum: POST /api/tenders/:id/addenda
5. Acknowledge addendum: POST /api/addenda/:id/acknowledge

**Proceed to TASK_PLAN_PHASE6.md**