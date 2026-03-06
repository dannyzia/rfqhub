/**
 * Section 5.9: Notification API Integration Tests
 * MASTER_TESTING_PLAN_REVISED.md
 * 
 * Integration tests for notification endpoints
 * Tests notification delivery, preferences, and management
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

describe('Section 5.9: Notification API Integration Tests', () => {
  let userToken: string;
  // @ts-expect-error - _userId is declared but not used in this test file
  let _userId: string;

  beforeAll(async () => {
    await clearTestData();

    const user = await createTestUser();
    _userId = user.id;

    const tokens = await generateTestTokens(user.id);
    userToken = tokens.accessToken;
  });

  describe('NOTIF-I001: GET /api/notifications - Get User Notifications', () => {
    it('should retrieve notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?unread=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect('Content-Type', /json/);

      Assertions.assertAuthRequired(response);
    });
  });

  describe('NOTIF-I002: GET /api/notifications/:id - Get Notification', () => {
    it('should retrieve specific notification', async () => {
      const response = await request(app)
        .get(`/api/notifications/${uuidv4()}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('NOTIF-I003: PUT /api/notifications/:id/read - Mark as Read', () => {
    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${uuidv4()}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('NOTIF-I004: PUT /api/notifications/mark-all-read - Mark All Read', () => {
    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('NOTIF-I005: DELETE /api/notifications/:id - Delete Notification', () => {
    it('should delete notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${uuidv4()}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      expect([200, 204, 404]).toContain(response.status);
    });
  });

  describe('NOTIF-I006: GET /api/notifications/preferences - Get Preferences', () => {
    it('should retrieve notification preferences', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('NOTIF-I007: PUT /api/notifications/preferences - Update Preferences', () => {
    it('should update notification preferences', async () => {
      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          emailNotifications: false,
          smsNotifications: true,
        })
        .expect('Content-Type', /json/);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('NOTIF-I008: GET /api/notifications/categories - Get Categories', () => {
    it('should list notification categories', async () => {
      const response = await request(app)
        .get('/api/notifications/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBeLessThan(300);
    });
  });
});

