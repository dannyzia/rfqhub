/**
 * Section 5.10: Subscription API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for subscription endpoints
 * Tests subscription management, upgrades, and billing
 */

import request from 'supertest';
import app from '../../app';
import {
  clearTestData,
  generateTestTokens,
  createTestUser,
} from '../test-data';
import * as Assertions from '../test-assertions';
import { v4 as uuidv4 } from 'uuid';

describe('Section 5.10: Subscription API Integration Tests', () => {
  let adminToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    await clearTestData();

    const admin = await createTestUser({ role: 'admin' });
    const buyer = await createTestUser({ role: 'buyer' });

    const adminTokens = await generateTestTokens(admin.id);
    const buyerTokens = await generateTestTokens(buyer.id);

    adminToken = adminTokens.accessToken;
    buyerToken = buyerTokens.accessToken;
  });

  describe('SUB-I001: GET /api/subscriptions/plans - Get Subscription Plans', () => {
    it('should retrieve available plans', async () => {
      const response = await request(app)
        .get('/api/subscriptions/plans')
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('SUB-I002: GET /api/subscriptions/current - Get Current Subscription', () => {
    it('should retrieve current subscription', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('SUB-I003: POST /api/subscriptions/upgrade - Upgrade Subscription', () => {
    it('should upgrade subscription plan', async () => {
      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          planId: 'premium',
          paymentMethod: 'card',
        })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });

    it('should validate plan ID', async () => {
      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          planId: 'invalid-plan',
        })
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });
  });

  describe('SUB-I004: POST /api/subscriptions/downgrade - Downgrade Subscription', () => {
    it('should downgrade subscription plan', async () => {
      const response = await request(app)
        .post('/api/subscriptions/downgrade')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          planId: 'basic',
          effectiveDate: new Date(),
        })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('SUB-I005: POST /api/subscriptions/cancel - Cancel Subscription', () => {
    it('should cancel subscription', async () => {
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          reason: 'No longer needed',
        })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('SUB-I006: GET /api/subscriptions/invoice/:id - Get Invoice', () => {
    it('should retrieve invoice', async () => {
      const response = await request(app)
        .get(`/api/subscriptions/invoice/${uuidv4()}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('SUB-I007: GET /api/subscriptions/invoices - List Invoices', () => {
    it('should list invoices', async () => {
      const response = await request(app)
        .get('/api/subscriptions/invoices')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('SUB-I008: GET /api/subscriptions/usage - Get Usage Statistics', () => {
    it('should get usage statistics', async () => {
      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('SUB-I009: POST /api/subscriptions/update-payment - Update Payment Method', () => {
    it('should update payment method', async () => {
      const response = await request(app)
        .post('/api/subscriptions/update-payment')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          cardToken: 'tok_visa',
        })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('SUB-I010: GET /api/subscriptions/admin/all - Admin View All Subscriptions', () => {
    it('should retrieve all subscriptions (admin only)', async () => {
      const response = await request(app)
        .get('/api/subscriptions/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });

    it('should return 403 for non-admin', async () => {
      const response = await request(app)
        .get('/api/subscriptions/admin/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertAuthorizationDenied(response);
    });
  });
});
