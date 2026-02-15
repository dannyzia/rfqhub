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
          password: 'Test@1234',
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
        // If registration fails, try to login instead (user might already exist)
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test.tendertype@example.com',
            password: 'Test@1234'
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
    it.skip('should suggest PG1 for small goods purchase', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'goods',
          estimatedValue: 300000,
          isInternational: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommended.code).toBe('PG1');
      expect(response.body.recommended.confidence).toBe(100);
    });

    it.skip('should suggest PG2 for medium goods purchase', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'goods',
          estimatedValue: 2000000,
          isInternational: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommended.code).toBe('PG2');
    });

    it.skip('should validate input schema', async () => {
      const response = await request(app)
        .post('/api/tender-types/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementType: 'invalid_type',
          estimatedValue: -1000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
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
    it.skip('should validate correct PG1 value', async () => {
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

    it.skip('should reject invalid PG1 value', async () => {
      const response = await request(app)
        .post('/api/tender-types/validate-value')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 10000000,
          tenderTypeCode: 'PG1'
        })
        .expect(200);

      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.suggestedType).toBeDefined();
    });

    it.skip('should validate PG2 value range', async () => {
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
    it.skip('should calculate securities for PG1', async () => {
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
      expect(response.body.data.tenderSecurity).toBe(0); // PG1 has no security
    });

    it.skip('should calculate securities for PG2', async () => {
      const response = await request(app)
        .post('/api/tender-types/calculate-securities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderValue: 5000000,
          tenderTypeCode: 'PG2'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tenderSecurity).toBe(100000); // 2% of 5M
      expect(response.body.data.performanceSecurity).toBe(250000); // 5% of 5M
    });

    it.skip('should validate tender value', async () => {
      const response = await request(app)
        .post('/api/tender-types/calculate-securities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tenderValue: -1000, // Invalid
          tenderTypeCode: 'PG2'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
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
    it.skip('should return PG1 document requirements', async () => {
      const response = await request(app)
        .get('/api/tender-types/PG1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data) || typeof response.body.data === 'object').toBe(true);
    });

    it.skip('should return PG2 document requirements', async () => {
      const response = await request(app)
        .get('/api/tender-types/PG2/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it.skip('should handle invalid tender type code', async () => {
      const response = await request(app)
        .get('/api/tender-types/INVALID/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/tender-types/PG1/documents')
        .expect(401);
    });
  });

  describe('Testing with multiple tender types', () => {
    it.skip('should handle works procurement type', async () => {
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

    it.skip('should handle services procurement type', async () => {
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
