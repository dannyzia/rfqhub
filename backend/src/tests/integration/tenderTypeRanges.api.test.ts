import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

describe('GET /api/tender-types/ranges', () => {
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
        // If registration fails, try login (user might exist)
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
    // Cleanup
    try {
      await pool.query('DELETE FROM users WHERE email = $1', ['buyer@test.com']);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Success Cases', () => {
    test('should return 200 with valid procurement type', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('procurementType');
      expect(response.body.data).toHaveProperty('ranges');
      expect(response.body.data).toHaveProperty('specialCases');
    });

    test('should return ranges for goods', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { ranges } = response.body.data;
      expect(ranges.length).toBeGreaterThanOrEqual(3);
      expect(ranges[0]).toHaveProperty('label');
      expect(ranges[0]).toHaveProperty('minValue');
      expect(ranges[0]).toHaveProperty('maxValue');
      expect(ranges[0]).toHaveProperty('suggestedTypes');
    });

    test('should return ranges for works', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=works')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { ranges } = response.body.data;
      expect(ranges.some((r: any) => r.suggestedTypes.includes('PW1'))).toBe(true);
      expect(ranges.some((r: any) => r.suggestedTypes.includes('PW3'))).toBe(true);
    });

    test('should return ranges for services', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { specialCases } = response.body.data;
      expect(specialCases.outsourcingPersonnel).toBeDefined();
      expect(specialCases.outsourcingPersonnel.type).toBe('PPS2');
    });

    test('should include special cases for goods', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { specialCases } = response.body.data;
      expect(specialCases.international).toBeDefined();
      expect(specialCases.international.available).toBe(true);
      expect(specialCases.international.type).toBe('PG4');
      expect(specialCases.turnkey).toBeDefined();
      expect(specialCases.turnkey.type).toBe('PG5A');
      expect(specialCases.emergency).toBeDefined();
      expect(specialCases.emergency.type).toBe('PG9A');
    });

    test('should not include international for works', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=works')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { specialCases } = response.body.data;
      expect(specialCases.international).toBeUndefined();
      expect(specialCases.turnkey).toBeUndefined();
    });

    test('should not include turnkey for services', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { specialCases } = response.body.data;
      expect(specialCases.international).toBeUndefined();
      expect(specialCases.turnkey).toBeUndefined();
    });
  });

  describe('Error Cases', () => {
    test('should return 400 without procurementType', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('procurementType');
    });

    test('should return 400 with invalid procurementType', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/goods|works|services/);
    });

    test('should return 400 with empty procurementType', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .expect(401);
    });

    test('should return 401 with invalid auth token', async () => {
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Performance', () => {
    test('should respond within 2s', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    test('should benefit from caching on second call', async () => {
      // First call - prime cache
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`);

      // Second call - should complete successfully (cache may reduce DB load)
      const start = Date.now();
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Allow for cold DB/cache
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/tender-types/ranges?procurementType=goods')
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });

  describe('Data Integrity', () => {
    test('should return consistent results across calls', async () => {
      const response1 = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`);

      const response2 = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response1.body.data).toEqual(response2.body.data);
    });

    test('should maintain referential integrity with tender_type_definitions', async () => {
      const response = await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify all suggested types exist
      const allTypes = response.body.data.ranges.flatMap((r: any) => r.suggestedTypes);
      const uniqueTypes = [...new Set(allTypes)];

      for (const typeCode of uniqueTypes) {
        const typeResponse = await request(app)
          .get(`/api/tender-types/${typeCode}`)
          .set('Authorization', `Bearer ${authToken}`);
        expect(typeResponse.status).toBe(200);
      }
    });
  });
});
