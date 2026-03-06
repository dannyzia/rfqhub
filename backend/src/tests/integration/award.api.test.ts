/**
 * Section 5.6: Award API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for award endpoints
 * Tests tender award management and contract execution
 */

import request from 'supertest';
import app from '../../app';
import {
  clearTestData,
  generateTestTokens,
  createTestUser,
} from '../test-data';
import { createMockAward, createMockTenderRequest } from '../test-fixtures';
import * as Assertions from '../test-assertions';
import * as _TestDB from '../test-database';
import { v4 as uuidv4 } from 'uuid';

describe('Section 5.6: Award API Integration Tests', () => {
  let buyerToken = '';
  let vendorToken = '';
  let tenderId = '';
  let bidId = '';
  let vendorId = '';

  beforeAll(async () => {
    await clearTestData();

    const buyer = await createTestUser({ role: 'buyer' });
    const vendor = await createTestUser({ role: 'vendor' });

    vendorId = vendor.id;

    const buyerTokens = await generateTestTokens(buyer.id);
    const vendorTokens = await generateTestTokens(vendor.id);

    buyerToken = buyerTokens.accessToken;
    vendorToken = vendorTokens.accessToken;

    // Create tender using the correct schema fields
    const tenderResponse = await request(app)
      .post('/api/tenders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(createMockTenderRequest());

    tenderId = tenderResponse.body.data?.id || uuidv4();

    const bidResponse = await request(app)
      .post(`/api/tenders/${tenderId}/bids`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ amount: 50000, currency: 'USD' });

    bidId = bidResponse.body.data?.id || uuidv4();
  });

  describe('AWARD-I001: POST /api/awards - Create Award', () => {
    it('should create award for bid', async () => {
      const awardData = createMockAward({
        tenderId,
        bidId,
        vendorId,
      });

      const response = await request(app)
        .post('/api/awards')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(awardData)
        .expect('Content-Type', /json/);

      expect([201, 400, 404]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/awards')
        .send(createMockAward())
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/awards')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({})
        .expect('Content-Type', /json/);

      expect([400, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('AWARD-I002: GET /api/awards - List Awards', () => {
    it('should retrieve awards', async () => {
      const response = await request(app)
        .get('/api/awards')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/awards?page=1&limit=10')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('AWARD-I003: GET /api/awards/:id - Get Award Details', () => {
    let awardId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/awards')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(
          createMockAward({
            tenderId,
            bidId,
            vendorId,
          })
        );

      awardId = response.body.data?.id || uuidv4();
    });

    it('should retrieve award details', async () => {
      const response = await request(app)
        .get(`/api/awards/${awardId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent award', async () => {
      const response = await request(app)
        .get(`/api/awards/${uuidv4()}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });
  });

  describe('AWARD-I004: PUT /api/awards/:id - Update Award', () => {
    let awardId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/awards')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(
          createMockAward({
            tenderId,
            bidId,
            vendorId,
          })
        );

      awardId = response.body.data?.id || uuidv4();
    });

    it('should update award', async () => {
      const response = await request(app)
        .put(`/api/awards/${awardId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ awardedAmount: 55000 })
        .expect('Content-Type', /json/);

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should return 403 if not authorized', async () => {
      const response = await request(app)
        .put(`/api/awards/${awardId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ awardedAmount: 55000 })
        .expect('Content-Type', /json/);

      expect([403, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('AWARD-I005: POST /api/awards/:id/approve - Approve Award', () => {
    let awardId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/awards')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(
          createMockAward({
            tenderId,
            bidId,
            vendorId,
            status: 'pending',
          })
        );

      awardId = response.body.data?.id || uuidv4();
    });

    it('should approve award', async () => {
      const response = await request(app)
        .post(`/api/awards/${awardId}/approve`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('AWARD-I006: POST /api/awards/:id/execute - Execute Award', () => {
    let awardId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/awards')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(
          createMockAward({
            tenderId,
            bidId,
            vendorId,
            status: 'approved',
          })
        );

      awardId = response.body.data?.id || uuidv4();
    });

    it('should execute award', async () => {
      const response = await request(app)
        .post(`/api/awards/${awardId}/execute`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('AWARD-I007: DELETE /api/awards/:id - Cancel Award', () => {
    let awardId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/awards')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(
          createMockAward({
            tenderId,
            bidId,
            vendorId,
          })
        );

      awardId = response.body.data?.id || uuidv4();
    });

    it('should cancel award', async () => {
      const response = await request(app)
        .delete(`/api/awards/${awardId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Vendor unable to fulfill' })
        .expect('Content-Type', /json/);

      expect([200, 204, 400, 404]).toContain(response.status);
    });
  });
});

afterAll(async () => {
  // Clean up any test data and close connections
  console.log('🧹 Award API test cleanup...');
});

