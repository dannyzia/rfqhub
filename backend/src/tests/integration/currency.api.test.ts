/**
 * Section 5.16: Currency API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for currency service endpoints
 * Tests currency retrieval, conversion, and exchange rate management
 */

import request from 'supertest';
import app from '../../app';
import {
  clearTestData,
  generateTestTokens,
  createTestUser,
} from '../test-data';
import * as Assertions from '../test-assertions';

describe('Section 5.16: Currency API Integration Tests', () => {
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

  describe('CURR-I001: GET /api/currencies - Get Supported Currencies', () => {
    it('should return list of supported currencies', async () => {
      const response = await request(app)
        .get('/api/currencies')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return currencies with correct structure', async () => {
      const response = await request(app)
        .get('/api/currencies')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      const currency = response.body.data[0];
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('symbol');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/currencies')
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('CURR-I002: GET /api/currencies/rates - Get Exchange Rates', () => {
    it('should return exchange rates for base currency', async () => {
      const response = await request(app)
        .get('/api/currencies/rates?base=USD')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      expect(response.body.data).toHaveProperty('base');
      expect(response.body.data).toHaveProperty('rates');
      expect(response.body.data.base).toBe('USD');
      expect(typeof response.body.data.rates).toBe('object');
    });

    it('should return 400 for invalid currency code', async () => {
      const response = await request(app)
        .get('/api/currencies/rates?base=INVALID')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/currencies/rates?base=USD')
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('CURR-I003: POST /api/currencies/convert - Convert Currency', () => {
    it('should convert amount between currencies', async () => {
      const conversionData = {
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
      };

      const response = await request(app)
        .post('/api/currencies/convert')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(conversionData)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('convertedAmount');
      expect(response.body.data).toHaveProperty('fromCurrency');
      expect(response.body.data).toHaveProperty('toCurrency');
      expect(response.body.data).toHaveProperty('rate');
      expect(response.body.data.fromCurrency).toBe('USD');
      expect(response.body.data.toCurrency).toBe('EUR');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/currencies/convert')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          amount: 100,
          // Missing fromCurrency and toCurrency
        })
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it('should return 400 for invalid currency codes', async () => {
      const response = await request(app)
        .post('/api/currencies/convert')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          amount: 100,
          fromCurrency: 'INVALID',
          toCurrency: 'EUR',
        })
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/currencies/convert')
        .send({
          amount: 100,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
        })
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('CURR-I004: GET /api/currencies/:code - Get Currency Details', () => {
    it('should return currency details for valid code', async () => {
      const response = await request(app)
        .get('/api/currencies/USD')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      expect(response.body.data).toHaveProperty('code');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('symbol');
      expect(response.body.data.code).toBe('USD');
    });

    it('should return 404 for invalid currency code', async () => {
      const response = await request(app)
        .get('/api/currencies/INVALID')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/currencies/USD')
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });
});

