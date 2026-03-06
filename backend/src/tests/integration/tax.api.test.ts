/**
 * Section 5.17: Tax API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for tax calculation endpoints
 * Tests tax rate retrieval, calculation, and validation
 */

import request from 'supertest';
import app from '../../app';
import {
  clearTestData,
  generateTestTokens,
  createTestUser,
} from '../test-data';
import * as Assertions from '../test-assertions';

describe('Section 5.17: Tax API Integration Tests', () => {
  // let _adminToken: string; // unused - removed to fix TS6133
  let buyerToken: string;

  beforeAll(async () => {
    await clearTestData();

    // Setup test users
    const admin = await createTestUser({
      role: 'admin',
    });
    const buyerUser = await createTestUser({
      role: 'buyer',
    });

    const _adminTokens = await generateTestTokens(admin.id);
    const buyerTokens = await generateTestTokens(buyerUser.id);

    void _adminTokens; // token available if needed in future tests
    buyerToken = buyerTokens.accessToken;
  });

  describe('TAX-I001: GET /api/tax/rates - Get Tax Rates', () => {
    it('should return tax rates for jurisdiction', async () => {
      const response = await request(app)
        .get('/api/tax/rates?country=US&state=CA')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      expect(response.body.data).toHaveProperty('country');
      expect(response.body.data).toHaveProperty('rates');
      expect(Array.isArray(response.body.data.rates)).toBe(true);
    });

    it('should return 400 for missing country parameter', async () => {
      const response = await request(app)
        .get('/api/tax/rates')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/tax/rates?country=US')
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('TAX-I002: POST /api/tax/calculate - Calculate Tax', () => {
    it('should calculate tax for given amount and jurisdiction', async () => {
      const taxData = {
        amount: 10000,
        country: 'US',
        state: 'CA',
        taxType: 'sales',
      };

      const response = await request(app)
        .post('/api/tax/calculate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(taxData)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('taxAmount');
      expect(response.body.data).toHaveProperty('totalAmount');
      expect(response.body.data).toHaveProperty('taxRate');
      expect(response.body.data.amount).toBe(10000);
      expect(response.body.data.totalAmount).toBeGreaterThan(10000);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/tax/calculate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          amount: 10000,
          // Missing country and taxType
        })
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/tax/calculate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          amount: -100, // Negative amount
          country: 'US',
          taxType: 'sales',
        })
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/tax/calculate')
        .send({
          amount: 10000,
          country: 'US',
          taxType: 'sales',
        })
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('TAX-I003: POST /api/tax/validate - Validate Tax ID', () => {
    it('should validate valid tax ID', async () => {
      const validationData = {
        taxId: '12-3456789',
        country: 'US',
      };

      const response = await request(app)
        .post('/api/tax/validate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(validationData)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data).toHaveProperty('taxId');
      expect(typeof response.body.data.valid).toBe('boolean');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/tax/validate')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          taxId: '12-3456789',
          // Missing country
        })
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/tax/validate')
        .send({
          taxId: '12-3456789',
          country: 'US',
        })
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('TAX-I004: GET /api/tax/jurisdictions - Get Tax Jurisdictions', () => {
    it('should return list of supported tax jurisdictions', async () => {
      const response = await request(app)
        .get('/api/tax/jurisdictions')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return jurisdictions with correct structure', async () => {
      const response = await request(app)
        .get('/api/tax/jurisdictions')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      const jurisdiction = response.body.data[0];
      expect(jurisdiction).toHaveProperty('country');
      expect(jurisdiction).toHaveProperty('name');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/tax/jurisdictions')
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });
});

