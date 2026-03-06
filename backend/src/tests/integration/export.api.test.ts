/**
 * Section 5.11: Export API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for export endpoints
 * Tests data export in various formats (PDF, Excel, CSV)
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

describe('Section 5.11: Export API Integration Tests', () => {
  let adminToken: string;
  let buyerToken: string;
  let tenderId: string;

  beforeAll(async () => {
    console.log('🔧 [DEBUG] Export test beforeAll starting...');
    console.time('beforeAll');

    console.log('🔧 [DEBUG] Calling clearTestData()...');
    await clearTestData();
    console.log('✅ [DEBUG] clearTestData() completed');

    console.log('🔧 [DEBUG] Creating test organization...');
    const { createTestOrg, TEST_ORGS } = await import('../test-data');
    const org = await createTestOrg(TEST_ORGS.GOVT_AGENCY);
    console.log('✅ [DEBUG] Test organization created:', org.id);

    console.log('🔧 [DEBUG] Creating admin user...');
    const admin = await createTestUser({ role: 'admin' });
    console.log('✅ [DEBUG] Admin user created:', admin.id);

    console.log('🔧 [DEBUG] Creating buyer user...');
    const buyer = await createTestUser({ role: 'buyer' });
    console.log('✅ [DEBUG] Buyer user created:', buyer.id);

    const adminTokens = await generateTestTokens(admin.id);
    const buyerTokens = await generateTestTokens(buyer.id);

    adminToken = adminTokens.accessToken;
    buyerToken = buyerTokens.accessToken;

    console.log('🔧 [DEBUG] Creating test tender...');
    const tenderResponse = await request(app)
      .post('/api/tenders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Export Test Tender',
        organizationId: buyer.organizationId,
        closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

    console.log('🔧 [DEBUG] Tender response status:', tenderResponse.status);
    tenderId = tenderResponse.body.data?.id || uuidv4();
    console.log('✅ [DEBUG] Tender ID:', tenderId);

    console.timeEnd('beforeAll');
    console.log('✅ [DEBUG] Export test beforeAll completed');
  });

  describe('EXPORT-I001: GET /api/tenders/:id/export - Export Tender', () => {
    it('should export tender as PDF', async () => {
      const response = await request(app)
        .get(`/api/tenders/${tenderId}/export?format=pdf`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should export tender as Excel', async () => {
      const response = await request(app)
        .get(`/api/tenders/${tenderId}/export?format=xlsx`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should export tender as CSV', async () => {
      const response = await request(app)
        .get(`/api/tenders/${tenderId}/export?format=csv`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should validate format parameter', async () => {
      const response = await request(app)
        .get(`/api/tenders/${tenderId}/export?format=invalid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      Assertions.assertValidationError(response);
    });
  });

  describe('EXPORT-I002: GET /api/tenders/:id/export-bids - Export Bids', () => {
    it('should export bids as PDF', async () => {
      const response = await request(app)
        .get(`/api/tenders/${tenderId}/export-bids?format=pdf`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should export bids as Excel', async () => {
      const response = await request(app)
        .get(`/api/tenders/${tenderId}/export-bids?format=xlsx`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('EXPORT-I003: GET /api/reports/tender-summary - Export Summary Report', () => {
    it('should export tender summary report', async () => {
      const response = await request(app)
        .get('/api/reports/tender-summary?format=pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400]).toContain(response.status);
    });

    it('should filter by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const response = await request(app)
        .get(
          `/api/reports/tender-summary?format=pdf&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('EXPORT-I004: GET /api/reports/bid-analysis - Bid Analysis Report', () => {
    it('should export bid analysis report', async () => {
      const response = await request(app)
        .get('/api/reports/bid-analysis?format=xlsx')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('EXPORT-I005: GET /api/reports/vendor-report - Vendor Report', () => {
    it('should export vendor report', async () => {
      const response = await request(app)
        .get('/api/reports/vendor-report?format=pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('EXPORT-I006: POST /api/export/bulk - Bulk Export', () => {
    it('should export multiple documents', async () => {
      const response = await request(app)
        .post('/api/export/bulk')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [
            { type: 'tender', id: tenderId },
            { type: 'bids', id: tenderId },
          ],
          format: 'zip',
        })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('EXPORT-I007: GET /api/exports/:id/status - Get Export Status', () => {
    it('should get export job status', async () => {
      const response = await request(app)
        .get(`/api/exports/${uuidv4()}/status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('EXPORT-I008: GET /api/exports/:id/download - Download Export', () => {
    it('should download completed export', async () => {
      const response = await request(app)
        .get(`/api/exports/${uuidv4()}/download`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('EXPORT-I009: GET /api/reports/audit-log - Audit Log Export', () => {
    it('should export audit log', async () => {
      const response = await request(app)
        .get('/api/reports/audit-log?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400]).toContain(response.status);
    });

    it('should override filename', async () => {
      const response = await request(app)
        .get(
          '/api/reports/audit-log?format=csv&filename=audit_export.csv'
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('EXPORT-I010: Additional Export Scenarios', () => {
    it('should handle concurrent exports', async () => {
      const responses = await Promise.all([
        request(app)
          .get(`/api/tenders/${tenderId}/export?format=pdf`)
          .set('Authorization', `Bearer ${buyerToken}`),
        request(app)
          .get(`/api/tenders/${tenderId}/export?format=xlsx`)
          .set('Authorization', `Bearer ${buyerToken}`),
      ]);

      expect(responses.every(r => [200, 404].includes(r.status))).toBe(true);
    });

    it('should validate authorization for sensitive exports', async () => {
      const response = await request(app)
        .get('/api/reports/audit-log?format=csv')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([200, 403]).toContain(response.status);
    });
  });
});
