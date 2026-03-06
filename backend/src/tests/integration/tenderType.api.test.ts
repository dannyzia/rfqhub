// backend/src/tests/integration/tenderType.api.test.ts

import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

interface TenderTypeResponse {
  code: string;
  procurement_type: string;
}

describe('Tender Type APIs - Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Create test user and get auth token
    try {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test.tendertype@example.com',
          password: 'Test@12345678',
          firstName: 'Test',
          lastName: 'User',
          role: 'buyer',
          companyName: 'Test Company'
        });

      // Debug: log the response
      if (registerResponse.status !== 201 && registerResponse.status !== 200) {
        console.error('Registration failed with status:', registerResponse.status);
        console.error('Response body:', JSON.stringify(registerResponse.body, null, 2));
      }

      // Auth controller returns token in data.accessToken
      authToken = registerResponse.body?.data?.accessToken;
      if (!authToken) {
        // If registration fails, try to login instead (user might already exists)
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test.tendertype@example.com',
            password: 'Test@12345678'
          });
        
        authToken = loginResponse.body?.data?.accessToken;
      }

      if (!authToken) {
        console.error('Failed to get auth token. Registration response:', JSON.stringify(registerResponse.body));
        console.error('No token available for tests');
        // Don't throw - might fail if re-running tests and user already exists
        // Tests will fail with 401 but at least they'll run
      }
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      await pool.query('DELETE FROM users WHERE email = $1', ['test.tendertype@example.com']);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await pool.end();
  });

  describe('GET /api/tender-types', () => {
    it('should list all tender types', async () => {
      const response = await request(app)
        .get('/api/tender-types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should filter tender types by procurement type', async () => {
      const response = await request(app)
        .get('/api/tender-types?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((type: TenderTypeResponse) => {
        expect(type.procurement_type).toBe('goods');
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/tender-types')
        .expect(401);
    });
  });

  describe('POST /api/tender-types/suggest', () => {
    it('should suggest PG1 for small goods purchase', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'goods',
          estimatedValue: 300000,
          isInternational: false,
          organizationType: 'government'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommended.code).toBe('PG1');
      expect(response.body.recommended.confidence).toBe(100);
    });

    it('should suggest PG2 for medium goods purchase', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'goods',
          estimatedValue: 2000000,
          isInternational: false,
          organizationType: 'government'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommended.code).toBe('PG2');
    });

    it('should validate input schema', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'invalid_type',
          estimatedValue: -1000
        })
        .expect(400);

      // Error responses use { error: { message, ... } } — no top-level success field
      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/tender-types/suggest')
        .send({
          procurementType: 'goods',
          estimatedValue: 300000
        })
        .expect(401);
    });
  });

  describe('POST /api/tender-types/validate-value', () => {
    it('should validate correct PG1 value', async () => {
      const response = await request(app)
        .post('/api/tender-types/validate-value')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 500000,
          tenderTypeCode: 'PG1'
        })
        .expect(200);

      expect(response.body.data.valid).toBe(true);
    });

    it('should reject invalid PG1 value', async () => {
      const response = await request(app)
        .post('/api/tender-types/validate-value')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: -1000,
          tenderTypeCode: 'PG1'
        })
        .expect(400);

      // Validation errors use { error: { message, ... } } structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should validate PG2 value range', async () => {
      const response = await request(app)
        .post('/api/tender-types/validate-value')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 3000000,
          tenderTypeCode: 'PG2'
        })
        .expect(200);

      expect(response.body.data.valid).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/tender-types/validate-value')
        .send({
          value: 500000,
          tenderTypeCode: 'PG1'
        })
        .expect(401);
    });
  });

  describe('POST /api/tender-types/calculate-securities', () => {
    it('should calculate securities for PG1', async () => {
      const response = await request(app)
        .post('/api/tender-types/calculate-securities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderValue: 500000,
          tenderTypeCode: 'PG1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // PG1 has no tender security - bidSecurity.applicable should be false
      expect(response.body.data.bidSecurity).toBeDefined();
      expect(response.body.data.bidSecurity.applicable).toBe(false);
    });

    it('should calculate securities for PG2', async () => {
      const response = await request(app)
        .post('/api/tender-types/calculate-securities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderValue: 5000000,
          tenderTypeCode: 'PG2'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // PG2: 2% bid security on 5M = 100,000 BDT; 5% performance security = 250,000 BDT
      expect(response.body.data.bidSecurity).toBeDefined();
      expect(response.body.data.bidSecurity.amount).toBe(100000);
      expect(response.body.data.performanceSecurity).toBeDefined();
      expect(response.body.data.performanceSecurity.amount).toBe(250000);
    });

    it('should validate tender value', async () => {
      const response = await request(app)
        .post('/api/tender-types/calculate-securities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderValue: -1000, // Invalid
          tenderTypeCode: 'PG2'
        })
        .expect(400);

      // Error responses use { error: { message, ... } } — no top-level success field
      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/tender-types/calculate-securities')
        .send({
          tenderValue: 5000000,
          tenderTypeCode: 'PG2'
        })
        .expect(401);
    });
  });

  describe('GET /api/tender-types/:code/documents', () => {
    it('should return PG1 document requirements', async () => {
      const response = await request(app)
        .get('/api/tender-types/PG1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data) || typeof response.body.data === 'object').toBe(true);
    });

    it('should return PG2 document requirements', async () => {
      const response = await request(app)
        .get('/api/tender-types/PG2/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle invalid tender type code', async () => {
      const response = await request(app)
        .get('/api/tender-types/INVALID/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Error responses use { error: { message, ... } } — no top-level success field
      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/tender-types/PG1/documents')
        .expect(401);
    });
  });

  describe('Testing with multiple tender types', () => {
    it('should handle works procurement type', async () => {
      const response = await request(app)
        .get('/api/tender-types?procurementType=works')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((type: TenderTypeResponse) => {
          expect(type.procurement_type).toBe('works');
        });
      }
    });

    it('should handle services procurement type', async () => {
      const response = await request(app)
        .get('/api/tender-types?procurementType=services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((type: TenderTypeResponse) => {
          expect(type.procurement_type).toBe('services');
        });
      }
    });
  });
});
