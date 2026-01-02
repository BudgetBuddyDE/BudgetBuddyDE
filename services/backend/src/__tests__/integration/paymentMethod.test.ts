import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {db} from '../../db';
import {HTTPStatusCode} from '../../models';
import {paymentMethodRouter} from '../../router/paymentMethod.router';
import {cleanupTestData, createTestFixtures, generateTestUserId, mockAuthMiddleware} from '../helpers';

describe('Payment Method Router Integration Tests', () => {
  let app: express.Application;
  let testUserId: string;
  let otherUserId: string;
  let testFixtures: Awaited<ReturnType<typeof createTestFixtures>>;

  beforeEach(async () => {
    testUserId = generateTestUserId('main');
    otherUserId = generateTestUserId('other');

    testFixtures = await createTestFixtures(testUserId);

    app = express();
    app.use(bodyParser.json());
    app.use(mockAuthMiddleware(testUserId));
    app.use('/api/paymentMethod', paymentMethodRouter);
  });

  afterEach(async () => {
    await cleanupTestData(testUserId);
    await cleanupTestData(otherUserId);
  });

  describe('GET /api/paymentMethod', () => {
    it('should return all payment methods for the authenticated user', async () => {
      const response = await request(app).get('/api/paymentMethod');

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.totalCount).toBe(2);
    });

    it('should filter payment methods by search term', async () => {
      const response = await request(app).get('/api/paymentMethod').query({search: 'Credit'});

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Credit');
    });

    it('should only return payment methods belonging to the authenticated user', async () => {
      await createTestFixtures(otherUserId);

      const response = await request(app).get('/api/paymentMethod');

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(2);
      for (const method of response.body.data) {
        expect(method.ownerId).toBe(testUserId);
      }
    });
  });

  describe('GET /api/paymentMethod/:id', () => {
    it('should return a specific payment method by ID', async () => {
      const methodId = testFixtures.paymentMethods[0].id;
      const response = await request(app).get(`/api/paymentMethod/${methodId}`);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data.id).toBe(methodId);
      expect(response.body.data.name).toBe('Main Account');
    });

    it('should return 404 when payment method does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/paymentMethod/${nonExistentId}`);

      expect(response.status).toBe(HTTPStatusCode.NOT_FOUND);
    });

    it('should not allow access to payment methods from other users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherMethodId = otherUserFixtures.paymentMethods[0].id;

      const response = await request(app).get(`/api/paymentMethod/${otherMethodId}`);

      expect(response.status).toBe(HTTPStatusCode.NOT_FOUND);
    });
  });

  describe('POST /api/paymentMethod', () => {
    it('should create a new payment method', async () => {
      const newMethod = {
        name: 'Savings Account',
        provider: 'Bank',
        address: 'DE89370400440532013001',
        description: 'My savings account',
      };

      const response = await request(app).post('/api/paymentMethod').send(newMethod);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Savings Account');
      expect(response.body.data[0].ownerId).toBe(testUserId);

      const created = await db.query.paymentMethods.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, response.body.data[0].id);
        },
      });
      expect(created).toBeDefined();
    });

    it('should automatically set ownerId to authenticated user', async () => {
      const newMethod = {
        name: 'Test Method',
        provider: 'Test',
        address: '1234',
      };

      const response = await request(app).post('/api/paymentMethod').send(newMethod);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data[0].ownerId).toBe(testUserId);
    });

    it('should reject invalid payment method data', async () => {
      const invalidMethod = {
        name: 'Test',
        // Missing required 'provider' and 'address' fields
      };

      const response = await request(app).post('/api/paymentMethod').send(invalidMethod);

      expect(response.status).toBe(HTTPStatusCode.BAD_REQUEST);
    });
  });

  describe('PUT /api/paymentMethod/:id', () => {
    it('should update an existing payment method', async () => {
      const methodId = testFixtures.paymentMethods[0].id;
      const updates = {
        name: 'Updated Account',
        description: 'Updated description',
      };

      const response = await request(app).put(`/api/paymentMethod/${methodId}`).send(updates);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data[0].name).toBe('Updated Account');

      const updated = await db.query.paymentMethods.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, methodId);
        },
      });
      expect(updated?.name).toBe('Updated Account');
    });

    it('should not allow updating payment methods from other users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherMethodId = otherUserFixtures.paymentMethods[0].id;

      const response = await request(app).put(`/api/paymentMethod/${otherMethodId}`).send({
        name: 'Hacked',
      });

      expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);

      const method = await db.query.paymentMethods.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, otherMethodId);
        },
      });
      expect(method?.name).not.toBe('Hacked');
    });
  });

  describe('DELETE /api/paymentMethod/:id', () => {
    it('should delete an existing payment method', async () => {
      const methodId = testFixtures.paymentMethods[0].id;

      const response = await request(app).delete(`/api/paymentMethod/${methodId}`);

      expect(response.status).toBe(HTTPStatusCode.OK);

      const deleted = await db.query.paymentMethods.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, methodId);
        },
      });
      expect(deleted).toBeUndefined();
    });

    it('should not allow deleting payment methods from other users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherMethodId = otherUserFixtures.paymentMethods[0].id;

      const response = await request(app).delete(`/api/paymentMethod/${otherMethodId}`);

      expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);

      const method = await db.query.paymentMethods.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, otherMethodId);
        },
      });
      expect(method).toBeDefined();
    });
  });

  describe('POST /api/paymentMethod/merge', () => {
    it('should merge source payment methods into target payment method', async () => {
      const sourceId = testFixtures.paymentMethods[0].id;
      const targetId = testFixtures.paymentMethods[1].id;

      const response = await request(app)
        .post('/api/paymentMethod/merge')
        .send({
          source: [sourceId],
          target: targetId,
        });

      expect(response.status).toBe(HTTPStatusCode.OK);

      // Verify source payment method was deleted
      const sourceMethod = await db.query.paymentMethods.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, sourceId);
        },
      });
      expect(sourceMethod).toBeUndefined();

      // Verify target payment method still exists
      const targetMethod = await db.query.paymentMethods.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, targetId);
        },
      });
      expect(targetMethod).toBeDefined();
    });

    it('should reject when source includes target', async () => {
      const methodId = testFixtures.paymentMethods[0].id;

      const response = await request(app)
        .post('/api/paymentMethod/merge')
        .send({
          source: [methodId],
          target: methodId,
        });

      expect(response.status).toBe(HTTPStatusCode.BAD_REQUEST);
      expect(response.body.message).toContain('Source payment methods cannot include the target');
    });

    it('should reject when payment methods belong to different users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const ownMethodId = testFixtures.paymentMethods[0].id;
      const otherMethodId = otherUserFixtures.paymentMethods[0].id;

      const response = await request(app)
        .post('/api/paymentMethod/merge')
        .send({
          source: [ownMethodId],
          target: otherMethodId,
        });

      expect(response.status).toBe(HTTPStatusCode.BAD_REQUEST);
      expect(response.body.message).toContain('do not belong to the user');
    });
  });

  describe('Authorization Tests', () => {
    it('should ensure all operations only affect authenticated user data', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);

      // Try to access other user's payment method
      const getResponse = await request(app).get(`/api/paymentMethod/${otherUserFixtures.paymentMethods[0].id}`);
      expect(getResponse.status).toBe(HTTPStatusCode.NOT_FOUND);

      // Try to update other user's payment method
      const updateResponse = await request(app)
        .put(`/api/paymentMethod/${otherUserFixtures.paymentMethods[0].id}`)
        .send({name: 'Hacked'});
      expect(updateResponse.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);

      // Try to delete other user's payment method
      const deleteResponse = await request(app).delete(`/api/paymentMethod/${otherUserFixtures.paymentMethods[0].id}`);
      expect(deleteResponse.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);

      // Verify other user's data is intact
      const otherMethod = await db.query.paymentMethods.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, otherUserFixtures.paymentMethods[0].id);
        },
      });
      expect(otherMethod).toBeDefined();
      expect(otherMethod?.ownerId).toBe(otherUserId);
    });
  });
});
