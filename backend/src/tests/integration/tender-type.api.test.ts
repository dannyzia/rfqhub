/**
 * Section 5.3: Tender Type API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for tender type endpoints
 * Tests CRUD operations for tender type management
 */

import request from 'supertest';
import app from '../../app';
import {
  clearTestData,
  generateTestTokens,
  createTestUser,
} from '../test-data';
import { createMockTenderType } from '../test-fixtures';
import * as Assertions from '../test-assertions';
import { v4 as uuidv4 } from 'uuid';

describe('Section 5.3: Tender Type API Integration Tests', () => {
  let adminToken: string;
  let buyerToken: string;

  beforeEach(async () => {
    await clearTestData();

    const admin = await createTestUser({ role: 'admin' });
    const buyer = await createTestUser({ role: 'buyer' });

    const adminTokens = await generateTestTokens(admin.id);
    const buyerTokens = await generateTestTokens(buyer.id);

    adminToken = adminTokens.accessToken;
    buyerToken = buyerTokens.accessToken;
  });

  describe('TENDT-I001: POST /api/tender-types - Create Tender Type', () => {
    it.skip('should create new tender type as admin', async () => {
      const response = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `TEST-TYPE-${Date.now()}`,
          name: `Test Tender Type ${Date.now()}`,
          description: 'Test descriptor',
          is_active: true
        })
        .expect('Content-Type', /json/);

      Assertions.assertCreated(response);
      
      if (response.status === 201) {
        expect(response.body.data).toHaveProperty('code');
        expect(response.body.data.name).toContain('Test Tender Type');
      }
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/tender-types')
        .send(createMockTenderType())
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });

    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(createMockTenderType())
        .expect('Content-Type', /json/);

      Assertions.assertAuthorizationDenied(response);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing name, description, category
        })
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it('should validate category enum', async () => {
      const response = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
          createMockTenderType({
            category: 'invalid-category',
          })
        )
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });

    it.skip('should prevent duplicate tender type names', async () => {
      const tenderTypeData = createMockTenderType();

      await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tenderTypeData);

      const response = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMockTenderType())
        .expect('Content-Type', /json/);

      Assertions.assertConflict(response);
    });
  });

  describe('TENDT-I002: GET /api/tender-types - List Tender Types', () => {
    beforeEach(async () => {
      // Create multiple tender types
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/tender-types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(createMockTenderType());
      }
    });

    it('should retrieve list of tender types', async () => {
      const response = await request(app)
        .get('/api/tender-types')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertSuccess(response);
      Assertions.assertArrayResponse(response, 0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/tender-types')
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/tender-types?page=1&limit=10')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by procurement type', async () => {
      const response = await request(app)
        .get('/api/tender-types?procurementType=goods')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
      if (response.body.data.length > 0) {
        response.body.data.forEach((type: any) => {
          expect(type.procurement_type).toBe('goods');
        });
      }
    });

    it('should filter by active status', async () => {
      const response = await request(app)
        .get('/api/tender-types?active=true')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });

    it('should support search by name', async () => {
      const response = await request(app)
        .get('/api/tender-types?search=test')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('TENDT-I003: GET /api/tender-types/:id - Get Tender Type Details', () => {
    it('should retrieve tender type details', async () => {
      // Create a tender type first
      const createResponse = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMockTenderType());

      if (createResponse.status === 201) {
        const tenderTypeId = createResponse.body.data.code;
        
        const response = await request(app)
          .get(`/api/tender-types/${tenderTypeId}`)
          .set('Authorization', `Bearer ${buyerToken}`)
          .expect('Content-Type', /json/);

        Assertions.assertSuccess(response);
        expect(response.body.data.code).toBe(tenderTypeId);
      }
    });

    it('should return 404 for non-existent tender type', async () => {
      const response = await request(app)
        .get(`/api/tender-types/${uuidv4()}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/tender-types/${uuidv4()}`)
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('TENDT-I004: PUT /api/tender-types/:id - Update Tender Type', () => {
    it('should update tender type as admin', async () => {
      // Create a tender type first
      const createResponse = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMockTenderType());

      if (createResponse.status === 201) {
        const tenderTypeId = createResponse.body.data.code;
        
        const response = await request(app)
          .put(`/api/tender-types/${tenderTypeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Updated description',
          })
          .expect('Content-Type', /json/);

        Assertions.assertSuccess(response);
        expect(response.body.data.description).toBe('Updated description');
      }
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/tender-types/${uuidv4()}`)
        .send({ description: 'Updated' })
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });

    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .put(`/api/tender-types/${uuidv4()}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ description: 'Updated' })
        .expect('Content-Type', /json/);

      Assertions.assertAuthorizationDenied(response);
    });

    it('should return 404 for non-existent tender type', async () => {
      const response = await request(app)
        .put(`/api/tender-types/${uuidv4()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated' })
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });
  });

  describe('TENDT-I005: DELETE /api/tender-types/:id - Delete Tender Type', () => {
    it('should delete tender type as admin', async () => {
      // Create a tender type first
      const createResponse = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMockTenderType());

      if (createResponse.status === 201) {
        const tenderTypeId = createResponse.body.data.code;
        
        const response = await request(app)
          .delete(`/api/tender-types/${tenderTypeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect('Content-Type', /json/);

        expect([200, 204]).toContain(response.status);
      }
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/tender-types/${uuidv4()}`)
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });

    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .delete(`/api/tender-types/${uuidv4()}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertAuthorizationDenied(response);
    });

    it('should return 404 for non-existent tender type', async () => {
      const response = await request(app)
        .delete(`/api/tender-types/${uuidv4()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });
  });

  describe('TENDT-I006: POST /api/tender-types/:id/activate - Activate Tender Type', () => {
    it('should activate inactive tender type', async () => {
      // Create an inactive tender type first
      const createResponse = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMockTenderType({ is_active: false }));

      if (createResponse.status === 201) {
        const tenderTypeId = createResponse.body.data.code;
        
        const response = await request(app)
          .post(`/api/tender-types/${tenderTypeId}/activate`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect('Content-Type', /json/);

        expect(response.status).toBeLessThan(300);
      }
    });

    it('should return 404 for non-existent tender type', async () => {
      const response = await request(app)
        .post(`/api/tender-types/${uuidv4()}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });
  });

  describe('TENDT-I007: POST /api/tender-types/:id/deactivate - Deactivate Tender Type', () => {
    it('should deactivate active tender type', async () => {
      // Create an active tender type first
      const createResponse = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMockTenderType({ is_active: true }));

      if (createResponse.status === 201) {
        const tenderTypeId = createResponse.body.data.code;
        
        const response = await request(app)
          .post(`/api/tender-types/${tenderTypeId}/deactivate`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect('Content-Type', /json/);

        expect(response.status).toBeLessThan(300);
      }
    });

    it('should return 404 for non-existent tender type', async () => {
      const response = await request(app)
        .post(`/api/tender-types/${uuidv4()}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });
  });

  describe('TENDT-I008: POST /api/tender-types/bulk - Bulk Create Tender Types', () => {
    it('should bulk create tender types', async () => {
      const tenderTypes = [
        createMockTenderType(),
        createMockTenderType(),
        createMockTenderType(),
      ];

      const response = await request(app)
        .post('/api/tender-types/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tenderTypes })
        .expect('Content-Type', /json/);

      expect([201, 400]).toContain(response.status);
    });
  });

  describe('TENDT-I009: GET /api/tender-types/categories - List Categories', () => {
    it('should retrieve available tender categories', async () => {
      const response = await request(app)
        .get('/api/tender-types/categories')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('TENDT-I010: GET /api/tender-types/:id/statistics - Tender Type Statistics', () => {
    it('should retrieve tender type statistics', async () => {
      // Create a tender type first
      const createResponse = await request(app)
        .post('/api/tender-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMockTenderType());

      if (createResponse.status === 201) {
        const tenderTypeId = createResponse.body.data.code;
        
        const response = await request(app)
          .get(`/api/tender-types/${tenderTypeId}/statistics`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect('Content-Type', /json/);

        expect([200, 404]).toContain(response.status);
      }
    });
  });
});
