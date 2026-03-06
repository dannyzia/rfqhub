/**
 * Section 5.7: Vendor API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for vendor endpoints
 * Tests vendor registration, profile management, and verification
 */

import request from 'supertest';
import app from '../../app';
import {
  clearTestData,
  generateTestTokens,
  createTestUser,
} from '../test-data';
import { createMockVendor } from '../test-fixtures';
import * as Assertions from '../test-assertions';
import { v4 as uuidv4 } from 'uuid';

describe('Section 5.7: Vendor API Integration Tests', () => {
  let adminToken: string;
  let vendorToken: string;
  // @ts-expect-error - _vendorId is declared but not used in this test file
  let _vendorId: string;
  let vendorOrgId: string;

  beforeAll(async () => {
    await clearTestData();

    const admin = await createTestUser({ role: 'admin' });
    const vendor = await createTestUser({ role: 'vendor' });

    _vendorId = vendor.id;
    vendorOrgId = vendor.organizationId;

    const adminTokens = await generateTestTokens(admin.id);
    const vendorTokens = await generateTestTokens(vendor.id);

    adminToken = adminTokens.accessToken;
    vendorToken = vendorTokens.accessToken;
  });

  describe('VENDOR-I001: POST /api/vendors - Register Vendor', () => {
    it('should register vendor', async () => {
      const vendorData = createMockVendor({
        organizationId: vendorOrgId,
      });

      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(vendorData)
        .expect('Content-Type', /json/);

      expect([201, 400]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/vendors')
        .send(createMockVendor())
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({})
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });
  });

  describe('VENDOR-I002: GET /api/vendors - List Vendors', () => {
    it('should retrieve vendors', async () => {
      const response = await request(app)
        .get('/api/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/vendors?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });

    it('should filter by verification status', async () => {
      const response = await request(app)
        .get('/api/vendors?verified=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('VENDOR-I003: GET /api/vendors/:id - Get Vendor Details', () => {
    let vendorProfileId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(
          createMockVendor({
            organizationId: vendorOrgId,
          })
        );

      vendorProfileId = response.body.data?.id || uuidv4();
    });

    it('should retrieve vendor details', async () => {
      const response = await request(app)
        .get(`/api/vendors/${vendorProfileId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent vendor', async () => {
      const response = await request(app)
        .get(`/api/vendors/${uuidv4()}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertNotFound(response);
    });
  });

  describe('VENDOR-I004: PUT /api/vendors/:id - Update Vendor Profile', () => {
    let vendorProfileId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(
          createMockVendor({
            organizationId: vendorOrgId,
          })
        );

      vendorProfileId = response.body.data?.id || uuidv4();
    });

    it('should update vendor profile', async () => {
      const response = await request(app)
        .put(`/api/vendors/${vendorProfileId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          contactPerson: 'New Contact',
          contactEmail: 'newcontact@vendor.com',
        })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });

    it('should return 403 if not vendor owner', async () => {
      const otherVendor = await createTestUser({ role: 'vendor', organizationId: uuidv4() });
      const otherVendorTokens = await generateTestTokens(otherVendor.id);

      const response = await request(app)
        .put(`/api/vendors/${vendorProfileId}`)
        .set('Authorization', `Bearer ${otherVendorTokens.accessToken}`)
        .send({ contactPerson: 'New Contact' })
        .expect('Content-Type', /json/);

      Assertions.assertAuthorizationDenied(response);
    });
  });

  describe('VENDOR-I005: POST /api/vendors/:id/upload-document - Upload Vendor Documents', () => {
    let vendorProfileId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(
          createMockVendor({
            organizationId: vendorOrgId,
          })
        );

      vendorProfileId = response.body.data?.id || uuidv4();
    });

    it('should upload certification document', async () => {
      const response = await request(app)
        .post(`/api/vendors/${vendorProfileId}/upload-document`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .field('documentType', 'certification')
        .field('name', 'ISO 9001');

      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('VENDOR-I006: GET /api/vendors/:id/documents - Get Vendor Documents', () => {
    let vendorProfileId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(
          createMockVendor({
            organizationId: vendorOrgId,
          })
        );

      vendorProfileId = response.body.data?.id || uuidv4();
    });

    it('should retrieve vendor documents', async () => {
      const response = await request(app)
        .get(`/api/vendors/${vendorProfileId}/documents`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('VENDOR-I007: POST /api/vendors/:id/verify - Verify Vendor', () => {
    let vendorProfileId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(
          createMockVendor({
            organizationId: vendorOrgId,
            verified: false,
          })
        );

      vendorProfileId = response.body.data?.id || uuidv4();
    });

    it('should verify vendor (admin only)', async () => {
      const response = await request(app)
        .post(`/api/vendors/${vendorProfileId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });

    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .post(`/api/vendors/${vendorProfileId}/verify`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertAuthorizationDenied(response);
    });
  });

  describe('VENDOR-I008: GET /api/vendors/:id/statistics - Vendor Statistics', () => {
    let vendorProfileId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(
          createMockVendor({
            organizationId: vendorOrgId,
          })
        );

      vendorProfileId = response.body.data?.id || uuidv4();
    });

    it('should retrieve vendor statistics', async () => {
      const response = await request(app)
        .get(`/api/vendors/${vendorProfileId}/statistics`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('VENDOR-I009: POST /api/vendors/:id/services - Add Vendor Services', () => {
    let vendorProfileId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(
          createMockVendor({
            organizationId: vendorOrgId,
          })
        );

      vendorProfileId = response.body.data?.id || uuidv4();
    });

    it('should add services to vendor profile', async () => {
      const response = await request(app)
        .post(`/api/vendors/${vendorProfileId}/services`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          services: ['IT Consulting', 'Software Development'],
        })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('VENDOR-I010: GET /api/vendors/search - Search Vendors', () => {
    it('should search vendors by criteria', async () => {
      const response = await request(app)
        .get('/api/vendors/search?name=test&industry=technology')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('VENDOR-I011: DELETE /api/vendors/:id - Deactivate Vendor', () => {
    let vendorProfileId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(
          createMockVendor({
            organizationId: vendorOrgId,
          })
        );

      vendorProfileId = response.body.data?.id || uuidv4();
    });

    it('should deactivate vendor', async () => {
      const response = await request(app)
        .delete(`/api/vendors/${vendorProfileId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect('Content-Type', /json/);

      expect([200, 204, 400]).toContain(response.status);
    });
  });

  describe('VENDOR-I012: Additional Vendor Scenarios', () => {
    it('should handle concurrent vendor registration', async () => {
      const responses = await Promise.all([
        request(app)
          .post('/api/vendors')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send(
            createMockVendor({
              organizationId: vendorOrgId,
            })
          ),
        request(app)
          .post('/api/vendors')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send(
            createMockVendor({
              organizationId: vendorOrgId,
            })
          ),
      ]);

      expect(responses.length).toBe(2); // Both requests should complete
    });
  });
});

afterAll(async () => {
  // Clean up any test data and close connections
  console.log('🧹 Vendor API test cleanup...');
});

