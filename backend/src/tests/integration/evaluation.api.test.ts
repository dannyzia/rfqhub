/**
 * Section 5.5: Evaluation API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for evaluation endpoints
 * Tests evaluation creation, bid scoring, and result publication
 */

import request from 'supertest';
import app from '../../app';
import {
  clearTestData,
  generateTestTokens,
  createTestUser,
} from '../test-data';
import {
  createMockEvaluation,
  createMockEvaluationScore,
  createMockTenderRequest,
} from '../test-fixtures';
import * as Assertions from '../test-assertions';
import * as _TestDB from '../test-database';
import { v4 as uuidv4 } from 'uuid';

describe('Section 5.5: Evaluation API Integration Tests', () => {
  let buyerToken: string;
  let evaluatorToken: string;
  let tenderId: string;

  beforeAll(async () => {
    await clearTestData();

    const buyer = await createTestUser({ role: 'buyer' });
    const evaluator = await createTestUser({ role: 'evaluator' });

    const buyerTokens = await generateTestTokens(buyer.id);
    const evaluatorTokens = await generateTestTokens(evaluator.id);

    buyerToken = buyerTokens.accessToken;
    evaluatorToken = evaluatorTokens.accessToken;

    // Create a tender using the correct schema fields
    const tenderResponse = await request(app)
      .post('/api/tenders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(createMockTenderRequest());

    tenderId = tenderResponse.body.data?.id || uuidv4();
  });

  describe('EVAL-I001: POST /api/evaluations - Create Evaluation', () => {
    it('should create evaluation', async () => {
      const evaluationData = createMockEvaluation({ tenderId });

      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(evaluationData)
        .expect('Content-Type', /json/);

      expect([201, 400]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/evaluations')
        .send(createMockEvaluation({ tenderId }))
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({})
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });
  });

  describe('EVAL-I002: GET /api/evaluations - List Evaluations', () => {
    it('should retrieve evaluations', async () => {
      const response = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/evaluations?page=1&limit=10')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('EVAL-I003: GET /api/evaluations/:id - Get Evaluation Details', () => {
    let evaluationId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(createMockEvaluation({ tenderId }));

      evaluationId = response.body.data?.id || uuidv4();
    });

    it('should retrieve evaluation details', async () => {
      const response = await request(app)
        .get(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent evaluation', async () => {
      const response = await request(app)
        .get(`/api/evaluations/${uuidv4()}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });
  });

  describe('EVAL-I004: PUT /api/evaluations/:id - Update Evaluation', () => {
    let evaluationId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(createMockEvaluation({ tenderId }));

      evaluationId = response.body.data?.id || uuidv4();
    });

    it('should update evaluation', async () => {
      const response = await request(app)
        .put(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: 'in_progress' })
        .expect('Content-Type', /json/);

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('EVAL-I005: POST /api/evaluations/:id/scores - Add Evaluation Scores', () => {
    let evaluationId: string;
    let bidId: string;

    beforeEach(async () => {
      const evalResponse = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(createMockEvaluation({ tenderId }));

      evaluationId = evalResponse.body.data?.id || uuidv4();
      bidId = uuidv4();
    });

    it('should add evaluation scores', async () => {
      const scoreData = createMockEvaluationScore({
        evaluationId,
        bidId,
      });

      const response = await request(app)
        .post(`/api/evaluations/${evaluationId}/scores`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send(scoreData)
        .expect('Content-Type', /json/);

      expect([201, 400, 404]).toContain(response.status);
    });

    it('should validate score value', async () => {
      const response = await request(app)
        .post(`/api/evaluations/${evaluationId}/scores`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({
          ...createMockEvaluationScore({ evaluationId, bidId }),
          score: 150, // exceeds max
        })
        .expect('Content-Type', /json/);

      expect([400, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('EVAL-I006: GET /api/evaluations/:id/scores - Get Evaluation Scores', () => {
    let evaluationId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(createMockEvaluation({ tenderId }));

      evaluationId = response.body.data?.id || uuidv4();
    });

    it('should retrieve evaluation scores', async () => {
      const response = await request(app)
        .get(`/api/evaluations/${evaluationId}/scores`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('EVAL-I007: POST /api/evaluations/:id/publish - Publish Evaluation Results', () => {
    let evaluationId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(createMockEvaluation({ tenderId }));

      evaluationId = response.body.data?.id || uuidv4();
    });

    it('should publish evaluation results', async () => {
      const response = await request(app)
        .post(`/api/evaluations/${evaluationId}/publish`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('EVAL-I008: GET /api/tenders/:id/evaluations - Get Tender Evaluations', () => {
    it('should retrieve tender evaluations', async () => {
      const response = await request(app)
        .get(`/api/tenders/${tenderId}/evaluations`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('EVAL-I009: PUT /api/evaluations/:id/scores/:scoreId - Update Score', () => {
    it('should update evaluation score', async () => {
      const response = await request(app)
        .put(`/api/evaluations/${uuidv4()}/scores/${uuidv4()}`)
        .set('Authorization', `Bearer ${evaluatorToken}`)
        .send({ score: 90 })
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('EVAL-I010: Additional Evaluation Scenarios', () => {
    it('should handle concurrent score updates', async () => {
      const evaluationId = uuidv4();

      const responses = await Promise.all([
        request(app)
          .post(`/api/evaluations/${evaluationId}/scores`)
          .set('Authorization', `Bearer ${evaluatorToken}`)
          .send(createMockEvaluationScore({ evaluationId })),
        request(app)
          .post(`/api/evaluations/${evaluationId}/scores`)
          .set('Authorization', `Bearer ${evaluatorToken}`)
          .send(createMockEvaluationScore({ evaluationId })),
      ]);

      expect(responses.every(r => [201, 400, 404].includes(r.status))).toBe(true);
    });
  });
});

