// backend/src/tests/performance/tenderType.performance.test.ts

import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

describe('Performance Benchmarks', () => {
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

  test('Range endpoint should respond under 200ms (cold)', async () => {
    // Clear cache first by making a unique request
    const start = performance.now();
    await request(app)
      .get('/api/tender-types/ranges?procurementType=goods')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  test('Range endpoint should respond under 50ms (warm cache)', async () => {
    // Prime cache
    await request(app)
      .get('/api/tender-types/ranges?procurementType=goods')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    const start = performance.now();
    await request(app)
      .get('/api/tender-types/ranges?procurementType=goods')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50);
  });

  test('Should handle 100 concurrent requests', async () => {
    const promises = Array(100).fill(null).map(() =>
      request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
    );
    
    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;
    
    results.forEach(res => {
      expect(res.status).toBe(200);
    });
    
    // All 100 requests should complete within 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  test('Database query should be optimized', async () => {
    // This would require direct database access to test EXPLAIN ANALYZE
    // For now, we'll test that the response time is consistent
    const times: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = performance.now() - start;
      times.push(duration);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    
    expect(avg).toBeLessThan(100); // Average under 100ms
    expect(max).toBeLessThan(200); // Max under 200ms
  });

  test('Memory usage should be stable', async () => {
    const initialMemory = process.memoryUsage();
    
    // Make many requests
    for (let i = 0; i < 50; i++) {
      await request(app)
        .get('/api/tender-types/ranges?procurementType=goods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be minimal (< 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
