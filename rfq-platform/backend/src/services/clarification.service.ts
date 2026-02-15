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
