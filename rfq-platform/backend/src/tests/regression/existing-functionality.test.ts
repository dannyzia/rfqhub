// backend/src/tests/regression/existing-functionality.test.ts

import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

describe('Regression Tests - Existing Functionality', () => {
  let authToken: string;

  beforeAll(async () => {
    // Register/create test user
    try {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'buyer@test.com',
          password: 'Test@1234',
          firstName: 'Test',
          lastName: 'Buyer',
          role: 'buyer',
          companyName: 'Test Company'
        });

      authToken = registerRes.body?.data?.accessToken;

      if (!authToken) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ email: 'buyer@test.com', password: 'Test@1234' });
        authToken = loginRes.body?.data?.accessToken;
      }

      if (!authToken) {
        throw new Error('Failed to obtain auth token');
      }
    } catch (error) {
      console.error('Auth setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      await pool.query('DELETE FROM users WHERE email = $1', ['buyer@test.com']);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Core Tender Functionality', () => {
    test('should list all tender types', async () => {
      const response = await request(app)
        .get('/api/tender-types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(10);
    });

    test('should get tender type by code', async () => {
      const response = await request(app)
        .get('/api/tender-types/PG1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('PG1');
    });

    test('should suggest tender types', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'goods',
          estimatedValue: 500000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should validate tender value', async () => {
      const response = await request(app)
        .post('/api/tender-types/validate-value')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 500000,
          tenderTypeCode: 'PG1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should calculate securities', async () => {
      const response = await request(app)
        .post('/api/tender-types/calculate-securities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderValue: 1000000,
          tenderTypeCode: 'PG2'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tenderSecurity');
    });
  });

  describe('Document Requirements', () => {
    test('should get required documents for tender type', async () => {
      const response = await request(app)
        .get('/api/tender-types/PG1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Authentication & Authorization', () => {
    test('should require authentication for protected endpoints', async () => {
      await request(app)
        .get('/api/tender-types')
        .expect(401);
    });

    test('should reject invalid auth token', async () => {
      await request(app)
        .get('/api/tender-types')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('should accept valid auth token', async () => {
      await request(app)
        .get('/api/tender-types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Data Integrity', () => {
    test('should return consistent data structure', async () => {
      const response = await request(app)
        .get('/api/tender-types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const tenderType = response.body.data[0];
      expect(tenderType).toHaveProperty('code');
      expect(tenderType).toHaveProperty('name');
      expect(tenderType).toHaveProperty('procurement_type');
      expect(tenderType).toHaveProperty('min_value_bdt');
      expect(tenderType).toHaveProperty('max_value_bdt');
    });

    test('should handle edge cases gracefully', async () => {
      // Test with very high value
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'goods',
          estimatedValue: 100000000 // 10 Crore
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should validate input parameters', async () => {
      // Test invalid procurement type
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'invalid',
          estimatedValue: 500000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Regression', () => {
    test('should maintain response time benchmarks', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/tender-types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;

      // Should respond within 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/tender-types')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });
});
