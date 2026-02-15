const fs = require('fs');
const path = require('path');

const basePath = 'rfq-platform/backend/src/services';

// Ensure directory exists
if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}

// Addendum Service
const addendumService = `import { v4 as uuidv4 } from 'uuid';
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
      'INSERT INTO addenda (id, tender_id, addendum_number, title, description, extends_deadline_days, published_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, tenderId, addendumNumber, input.title, input.description, input.extendsDeadlineDays || null, userId]
    );

    if (input.extendsDeadlineDays && input.extendsDeadlineDays > 0) {
      await pool.query(
        "UPDATE tenders SET submission_deadline = submission_deadline + INTERVAL '1 day' * $1, updated_at = NOW() WHERE id = $2",
        [input.extendsDeadlineDays, tenderId]
      );
      logger.info('Tender deadline extended: tenderId=' + tenderId + ' extensionDays=' + input.extendsDeadlineDays);
    }

    if (tender.rows[0].status === 'open') {
      const vendors = await pool.query(
        "SELECT DISTINCT vp.organization_id FROM vendor_profiles vp WHERE vp.status = 'approved'"
      );

      for (const vendor of vendors.rows) {
        await pool.query(
          'INSERT INTO addendum_acknowledgements (addendum_id, vendor_org_id) VALUES ($1, $2) ON CONFLICT (addendum_id, vendor_org_id) DO NOTHING',
          [id, vendor.organization_id]
        );
      }
    } else {
      const invitations = await pool.query(
        'SELECT vendor_org_id FROM tender_vendor_invitations WHERE tender_id = $1',
        [tenderId]
      );

      for (const inv of invitations.rows) {
        await pool.query(
          'INSERT INTO addendum_acknowledgements (addendum_id, vendor_org_id) VALUES ($1, $2) ON CONFLICT (addendum_id, vendor_org_id) DO NOTHING',
          [id, inv.vendor_org_id]
        );
      }
    }

    logger.info('Addendum created: addendumId=' + id + ' tenderId=' + tenderId + ' addendumNumber=' + addendumNumber);
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
      'UPDATE addendum_acknowledgements SET acknowledged_at = NOW(), acknowledged_by = $1 WHERE addendum_id = $2 AND vendor_org_id = $3 RETURNING *',
      [userId, addendumId, vendorOrgId]
    );

    logger.info('Addendum acknowledged: addendumId=' + addendumId + ' vendorOrgId=' + vendorOrgId + ' userId=' + userId);
    return rows[0];
  },

  async getAcknowledgementStatus(addendumId: string): Promise<AcknowledgementRow[]> {
    const { rows } = await pool.query<AcknowledgementRow>(
      'SELECT aa.*, o.name as vendor_name FROM addendum_acknowledgements aa JOIN organizations o ON o.id = aa.vendor_org_id WHERE aa.addendum_id = $1',
      [addendumId]
    );
    return rows;
  },

  async getUnacknowledgedByVendor(tenderId: string, vendorOrgId: string): Promise<AddendumRow[]> {
    const { rows } = await pool.query<AddendumRow>(
      'SELECT a.* FROM addenda a JOIN addendum_acknowledgements aa ON aa.addendum_id = a.id WHERE a.tender_id = $1 AND aa.vendor_org_id = $2 AND aa.acknowledged_at IS NULL ORDER BY a.addendum_number ASC',
      [tenderId, vendorOrgId]
    );
    return rows;
  },

  async hasUnacknowledgedAddenda(tenderId: string, vendorOrgId: string): Promise<boolean> {
    const unacknowledged = await this.getUnacknowledgedByVendor(tenderId, vendorOrgId);
    return unacknowledged.length > 0;
  },
};
`;

// Clarification Service
const clarificationService = `import { v4 as uuidv4 } from 'uuid';
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
      "INSERT INTO clarification_questions (id, tender_id, vendor_org_id, question_text, is_public, status) VALUES ($1, $2, $3, $4, $5, 'open') RETURNING *",
      [id, tenderId, vendorOrgId, input.questionText, input.isPublic]
    );

    if (tender.rows[0].status === 'published') {
      await pool.query(
        "UPDATE tenders SET status = 'clarification', updated_at = NOW() WHERE id = $1",
        [tenderId]
      );
    }

    logger.info('Clarification question created: questionId=' + id + ' tenderId=' + tenderId + ' vendorOrgId=' + vendorOrgId);
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
      query += \` AND (vendor_org_id = $\${paramIndex} OR is_public = true)\`;
      params.push(vendorOrgId);
      paramIndex++;
    }

    if (isPublic !== undefined) {
      query += \` AND is_public = $\${paramIndex}\`;
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
      'INSERT INTO clarification_answers (id, question_id, buyer_user_id, answer_text, creates_addendum) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, questionId, buyerUserId, input.answerText, input.createsAddendum]
    );

    await pool.query(
      "UPDATE clarification_questions SET status = 'answered' WHERE id = $1",
      [questionId]
    );

    const openQuestions = await pool.query(
      "SELECT COUNT(*) as count FROM clarification_questions WHERE tender_id = $1 AND status = 'open'",
      [question.tender_id]
    );

    if (parseInt(openQuestions.rows[0].count) === 0) {
      await pool.query(
        "UPDATE tenders SET status = 'published', updated_at = NOW() WHERE id = $1 AND status = 'clarification'",
        [question.tender_id]
      );
    }

    logger.info('Question answered: answerId=' + id + ' questionId=' + questionId + ' createsAddendum=' + input.createsAddendum);
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
      "UPDATE clarification_questions SET status = 'closed' WHERE id = $1",
      [questionId]
    );

    logger.info('Question closed: questionId=' + questionId);
  },
};
`;

// Evaluation Service
const evaluationService = `import { v4 as uuidv4 } from 'uuid';
import { pool, logger } from '../config';
import type { CreateEvaluationInput } from '../schemas/evaluation.schema';

interface EvaluationRow {
  id: string;
  tender_id: string;
  evaluator_id: string;
  technical_scores: Record<string, unknown>;
  commercial_score: number | null;
  total_score: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BidLineScoreRow {
  id: string;
  bid_id: string;
  feature_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export const evaluationService = {
  async create(tenderId: string, evaluatorId: string, input: CreateEvaluationInput): Promise<EvaluationRow> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== input.buyerOrgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'evaluation') {
      throw Object.assign(new Error('Evaluation can only be created for tenders in evaluation status'), { statusCode: 409, code: 'CONFLICT' });
    }

    const id = uuidv4();

    const { rows } = await pool.query<EvaluationRow>(
      "INSERT INTO evaluations (id, tender_id, evaluator_id, technical_scores, commercial_score, total_score, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *",
      [id, tenderId, evaluatorId, input.technicalScores, input.commercialScore || null, input.totalScore || null]
    );

    logger.info('Evaluation created: evaluationId=' + id + ' tenderId=' + tenderId + ' evaluatorId=' + evaluatorId);
    return rows[0];
  },

  async openEnvelope(tenderId: string, envelopeType: 'technical' | 'commercial', orgId: string): Promise<void> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'evaluation') {
      throw Object.assign(new Error('Envelopes can only be opened for tenders in evaluation status'), { statusCode: 409, code: 'CONFLICT' });
    }

    if (envelopeType === 'technical') {
      await pool.query(
        "UPDATE bids SET technical_envelope_opened = true, updated_at = NOW() WHERE tender_id = $1",
        [tenderId]
      );
      logger.info('Technical envelopes opened: tenderId=' + tenderId);
    } else {
      await pool.query(
        "UPDATE bids SET commercial_envelope_opened = true, updated_at = NOW() WHERE tender_id = $1",
        [tenderId]
      );
      logger.info('Commercial envelopes opened: tenderId=' + tenderId);
    }
  },

  async openBids(tenderId: string, orgId: string): Promise<void> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (tender.rows[0].status !== 'evaluation') {
      throw Object.assign(new Error('Bids can only be opened for tenders in evaluation status'), { statusCode: 409, code: 'CONFLICT' });
    }

    await pool.query(
      "UPDATE bids SET opened = true, updated_at = NOW() WHERE tender_id = $1",
      [tenderId]
    );
    logger.info('Bids opened: tenderId=' + tenderId);
  },

  async unlockCommercial(tenderId: string, vendorOrgId: string, orgId: string): Promise<void> {
    const tender = await pool.query(
      'SELECT id, status, buyer_org_id FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error('Tender not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    const bid = await pool.query(
      'SELECT id FROM bids WHERE tender_id = $1 AND vendor_org_id = $2',
      [tenderId, vendorOrgId]
    );

    if (bid.rows.length === 0) {
      throw Object.assign(new Error('Bid not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    await pool.query(
      "UPDATE bids SET commercial_unlocked = true, updated_at = NOW() WHERE id = $1",
      [bid.rows[0].id]
    );
    logger.info('Commercial bid unlocked: bidId=' + bid.rows[0].id + ' tenderId=' + tenderId + ' vendorOrgId=' + vendorOrgId);
  },

  async findByTenderId(tenderId: string): Promise<EvaluationRow[]> {
    const { rows } = await pool.query<EvaluationRow>(
      'SELECT * FROM evaluations WHERE tender_id = $1 ORDER BY created_at DESC',
      [tenderId]
    );
    return rows;
  },

  async findById(evaluationId: string): Promise<EvaluationRow | null> {
    const { rows } = await pool.query<EvaluationRow>(
      'SELECT * FROM evaluations WHERE id = $1',
      [evaluationId]
    );
    return rows[0] || null;
  },

  async findByBidId(bidId: string): Promise<EvaluationRow | null> {
    const { rows } = await pool.query<EvaluationRow>(
      'SELECT * FROM evaluations WHERE bid_id = $1',
      [bidId]
    );
    return rows[0] || null;
  },

  async getLineScores(bidId: string): Promise<BidLineScoreRow[]> {
    const { rows } = await pool.query<BidLineScoreRow>(
      'SELECT * FROM bid_line_scores WHERE bid_id = $1 ORDER BY feature_id ASC',
      [bidId]
    );
    return rows;
  },

  async createLineScore(bidId: string, featureId: string, score: number, comment?: string): Promise<BidLineScoreRow> {
    const id = uuidv4();

    const { rows } = await pool.query<BidLineScoreRow>(
      'INSERT INTO bid_line_scores (id, bid_id, feature_id, score, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, bidId, featureId, score, comment || null]
    );

    logger.info('Line score created: bidLineScoreId=' + id + ' bidId=' + bidId + ' featureId=' + featureId + ' score=' + score);
    return rows[0];
  },

  async updateLineScore(bidLineScoreId: string, score: number, comment?: string): Promise<BidLineScoreRow> {
    const { rows } = await pool.query<BidLineScoreRow>(
      'UPDATE bid_line_scores SET score = $1, comment = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [score, comment || null, bidLineScoreId]
    );

    logger.info('Line score updated: bidLineScoreId=' + bidLineScoreId + ' score=' + score);
    return rows[0];
  },

  async calculateTotalScore(tenderId: string, vendorOrgId: string): Promise<number> {
    const bid = await pool.query(
      'SELECT id FROM bids WHERE tender_id = $1 AND vendor_org_id = $2',
      [tenderId, vendorOrgId]
    );

    if (bid.rows.length === 0) {
      throw Object.assign(new Error('Bid not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const lineScores = await this.getLineScores(bid.rows[0].id);
    const totalScore = lineScores.reduce((sum, score) => sum + score.score, 0);

    logger.info('Total score calculated: bidId=' + bid.rows[0].id + ' totalScore=' + totalScore);
    return totalScore;
  },

  async getComparisonMatrix(tenderId: string): Promise<Record<string, unknown>[]> {
    const bids = await pool.query(
      'SELECT b.id, b.vendor_org_id, o.name as vendor_name FROM bids b JOIN organizations o ON o.id = b.vendor_org_id WHERE b.tender_id = $1',
      [tenderId]
    );

    const matrix = [];
    for (const bid of bids.rows) {
      const lineScores = await this.getLineScores(bid.id);
      const totalScore = await this.calculateTotalScore(tenderId, bid.vendor_org_id);

      matrix.push({
        vendorId: bid.vendor_org_id,
        vendorName: bid.vendor_name,
        lineScores,
        totalScore,
      });
    }

    logger.info('Comparison matrix generated: tenderId=' + tenderId + ' vendors=' + matrix.length);
    return matrix;
  },
};
`;

// Notification Service
const notificationService = `import { v4 as uuidv4 } from 'uuid';
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
const RETRY_DELAYS = [60000, 300000, 1500000];

export const notificationService = {
  async create(input: CreateNotificationInput): Promise<NotificationRow> {
    const id = uuidv4();

    const { rows } = await pool.query<NotificationRow>(
      "INSERT INTO notifications (id, tender_id, recipient_id, notification_type, channel, status, payload) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *",
      [id, input.tenderId || null, input.recipientId, input.notificationType, input.channel, input.payload || null]
    );

    logger.debug('Notification created: ' + id + ' type: ' + input.notificationType);
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

    logger.info('Bulk notifications created: count=' + notifications.length + ' type=' + notificationType);
    return notifications;
  },

  async findPending(limit: number = 50): Promise<NotificationRow[]> {
    const { rows } = await pool.query<NotificationRow>(
      "SELECT * FROM notifications WHERE status IN ('pending', 'retried') ORDER BY created_at ASC LIMIT $1",
      [limit]
    );
    return rows;
  },

  async findByRecipientId(recipientId: string, limit: number = 50, offset: number = 0): Promise<NotificationRow[]> {
    const { rows } = await pool.query<NotificationRow>(
      'SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [recipientId, limit, offset]
    );
    return rows;
  },

  async markAsSent(notificationId: string): Promise<void> {
    await pool.query(
      "UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1",
      [notificationId]
    );
    logger.debug('Notification marked as sent: ' + notificationId);
  },

  async markAsDelivered(notificationId: string): Promise<void> {
    await pool.query(
      "UPDATE notifications SET status = 'delivered' WHERE id = $1",
      [notificationId]
    );
  },

  async markAsFailed(notificationId: string, reason: string, retryCount: number): Promise<void> {
    if (retryCount < MAX_RETRIES) {
      await pool.query(
        "UPDATE notifications SET status = 'retried', failed_reason = $1 WHERE id = $2",
        [reason, notificationId]
      );
      logger.warn('Notification failed, will retry: id=' + notificationId + ' reason=' + reason + ' retryCount=' + retryCount);
    } else {
      await pool.query(
        "UPDATE notifications SET status = 'failed', failed_reason = $1 WHERE id = $2",
        [reason, notificationId]
      );
      logger.error('Notification failed permanently: id=' + notificationId + ' reason=' + reason);
    }
  },

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    logger.info('Email would be sent (placeholder) to=' + to + ' subject=' + subject);
    return true;
  },

  async sendSms(to: string, message: string): Promise<boolean> {
    logger.info('SMS would be sent (placeholder) to=' + to);
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
        success = await this.sendSms(email, message);
      } else if (notification.channel === 'in_app') {
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
      logger.info('Processed pending notifications: count=' + processed);
    }

    return processed;
  },

  getEmailSubject(type: string, payload: Record<string, unknown>): string {
    const subjects: Record<string, string> = {
      tender_published: 'New Tender: ' + (payload.tenderTitle || 'Untitled'),
      invitation_sent: 'Invitation: ' + (payload.tenderTitle || 'Tender Invitation'),
      addendum_published: 'Addendum Published: ' + (payload.tenderTitle || 'Tender'),
      clarification_answered: 'Your Question Answered: ' + (payload.tenderTitle || 'Tender'),
      deadline_reminder_3d: 'Reminder: 3 Days Until Deadline - ' + (payload.tenderTitle || 'Tender'),
      deadline_reminder_1d: 'URGENT: 1 Day Until Deadline - ' + (payload.tenderTitle || 'Tender'),
      bid_submitted: 'Bid Submitted Successfully: ' + (payload.tenderTitle || 'Tender'),
      bid_opening: 'Bids Opened: ' + (payload.tenderTitle || 'Tender'),
      tender_awarded: 'Award Notification: ' + (payload.tenderTitle || 'Tender'),
      vendor_doc_expiry_30d: 'Document Expiring Soon: ' + (payload.documentType || 'Document'),
      vendor_doc_expiry_7d: 'URGENT: Document Expiring: ' + (payload.documentType || 'Document'),
    };
    return subjects[type] || 'RFQ Buddy Notification';
  },

  getEmailBody(type: string, payload: Record<string, unknown>, recipientName: string): string {
    return 'Dear ' + recipientName + ',\\\\n\\\\n' + JSON.stringify(payload, null, 2) + '\\\\n\\\\nBest regards,\\\\nRFQ Buddy Team';
  },

  getSmsMessage(type: string, payload: Record<string, unknown>): string {
    return 'RFQ Buddy: ' + this.getEmailSubject(type, payload);
  },

  async notifyTenderPublished(tenderId: string, tenderTitle: string): Promise<void> {
    const tender = await pool.query(
      'SELECT visibility FROM tenders WHERE id = $1',
      [tenderId]
    );

    if (tender.rows[0].visibility === 'open') {
      const vendors = await pool.query(
        "SELECT u.id FROM users u JOIN vendor_profiles vp ON vp.organization_id = u.organization_id WHERE vp.status = 'approved' AND 'vendor' = ANY(u.roles)"
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
      "SELECT id FROM users WHERE organization_id = $1 AND 'vendor' = ANY(roles)",
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
      "SELECT id FROM users WHERE organization_id = $1 AND 'buyer' = ANY(roles)",
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
`;

// Write all files
fs.writeFileSync(path.join(basePath, 'addendum.service.ts'), addendumService);
fs.writeFileSync(path.join(basePath, 'clarification.service.ts'), clarificationService);
fs.writeFileSync(path.join(basePath, 'evaluation.service.ts'), evaluationService);
fs.writeFileSync(path.join(basePath, 'notification.service.ts'), notificationService);

console.log('All service files created successfully!');
