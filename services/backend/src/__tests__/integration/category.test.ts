import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {db} from '../../db';
import {HTTPStatusCode} from '../../models';
import {categoryRouter} from '../../router/category.router';
import {cleanupTestData, createTestFixtures, generateTestUserId, mockAuthMiddleware} from '../helpers';

describe('Category Router Integration Tests', () => {
  let app: express.Application;
  let testUserId: string;
  let otherUserId: string;
  let testFixtures: Awaited<ReturnType<typeof createTestFixtures>>;

  beforeEach(async () => {
    // Generate unique user IDs for each test
    testUserId = generateTestUserId('main');
    otherUserId = generateTestUserId('other');

    // Create test fixtures
    testFixtures = await createTestFixtures(testUserId);

    // Setup Express app with mocked auth
    app = express();
    app.use(bodyParser.json());
    app.use(mockAuthMiddleware(testUserId));
    app.use('/api/category', categoryRouter);
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData(testUserId);
    await cleanupTestData(otherUserId);
  });

  describe('GET /api/category', () => {
    it('should return all categories for the authenticated user', async () => {
      const response = await request(app).get('/api/category');

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.totalCount).toBe(2);
    });

    it('should filter categories by search term', async () => {
      const response = await request(app).get('/api/category').query({search: 'Groceries'});

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Groceries');
    });

    it('should support pagination', async () => {
      const response = await request(app).get('/api/category').query({from: 0, to: 1});

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.totalCount).toBe(2);
    });

    it('should only return categories belonging to the authenticated user', async () => {
      // Create categories for another user
      await createTestFixtures(otherUserId);

      const response = await request(app).get('/api/category');

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(2);
      // Verify all returned categories belong to testUserId
      for (const category of response.body.data) {
        expect(category.ownerId).toBe(testUserId);
      }
    });
  });

  describe('GET /api/category/:id', () => {
    it('should return a specific category by ID', async () => {
      const categoryId = testFixtures.categories[0].id;
      const response = await request(app).get(`/api/category/${categoryId}`);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data.id).toBe(categoryId);
      expect(response.body.data.name).toBe('Groceries');
    });

    it('should return 404 when category does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/category/${nonExistentId}`);

      expect(response.status).toBe(HTTPStatusCode.NOT_FOUND);
    });

    it('should not allow access to categories from other users', async () => {
      // Create category for another user
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherCategoryId = otherUserFixtures.categories[0].id;

      const response = await request(app).get(`/api/category/${otherCategoryId}`);

      expect(response.status).toBe(HTTPStatusCode.NOT_FOUND);
    });
  });

  describe('POST /api/category', () => {
    it('should create a new category', async () => {
      const newCategory = {
        name: 'Transport',
        description: 'Car, public transport, etc.',
      };

      const response = await request(app).post('/api/category').send(newCategory);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Transport');
      expect(response.body.data[0].ownerId).toBe(testUserId);

      // Verify it was actually created in the database
      const created = await db.query.categories.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, response.body.data[0].id);
        },
      });
      expect(created).toBeDefined();
      expect(created?.name).toBe('Transport');
    });

    it('should automatically set ownerId to authenticated user', async () => {
      const newCategory = {
        name: 'Test Category',
      };

      const response = await request(app).post('/api/category').send(newCategory);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data[0].ownerId).toBe(testUserId);
    });

    it('should reject invalid category data', async () => {
      const invalidCategory = {
        // Missing required 'name' field
        description: 'Invalid',
      };

      const response = await request(app).post('/api/category').send(invalidCategory);

      expect(response.status).toBe(HTTPStatusCode.BAD_REQUEST);
    });
  });

  describe('PUT /api/category/:id', () => {
    it('should update an existing category', async () => {
      const categoryId = testFixtures.categories[0].id;
      const updates = {
        name: 'Updated Groceries',
        description: 'Updated description',
      };

      const response = await request(app).put(`/api/category/${categoryId}`).send(updates);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data[0].name).toBe('Updated Groceries');

      // Verify update in database
      const updated = await db.query.categories.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, categoryId);
        },
      });
      expect(updated?.name).toBe('Updated Groceries');
    });

    it('should not allow updating categories from other users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherCategoryId = otherUserFixtures.categories[0].id;

      const response = await request(app).put(`/api/category/${otherCategoryId}`).send({
        name: 'Hacked',
      });

      expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);

      // Verify it wasn't updated
      const category = await db.query.categories.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, otherCategoryId);
        },
      });
      expect(category?.name).not.toBe('Hacked');
    });
  });

  describe('DELETE /api/category/:id', () => {
    it('should delete an existing category', async () => {
      const categoryId = testFixtures.categories[0].id;

      const response = await request(app).delete(`/api/category/${categoryId}`);

      expect(response.status).toBe(HTTPStatusCode.OK);

      // Verify deletion in database
      const deleted = await db.query.categories.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, categoryId);
        },
      });
      expect(deleted).toBeUndefined();
    });

    it('should not allow deleting categories from other users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherCategoryId = otherUserFixtures.categories[0].id;

      const response = await request(app).delete(`/api/category/${otherCategoryId}`);

      expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);

      // Verify it wasn't deleted
      const category = await db.query.categories.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, otherCategoryId);
        },
      });
      expect(category).toBeDefined();
    });
  });

  describe('POST /api/category/merge', () => {
    it('should merge source categories into target category', async () => {
      const sourceId = testFixtures.categories[0].id;
      const targetId = testFixtures.categories[1].id;

      const response = await request(app)
        .post('/api/category/merge')
        .send({
          source: [sourceId],
          target: targetId,
        });

      expect(response.status).toBe(HTTPStatusCode.OK);

      // Verify source category was deleted
      const sourceCategory = await db.query.categories.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, sourceId);
        },
      });
      expect(sourceCategory).toBeUndefined();

      // Verify transactions were moved to target category
      const movedTransactions = await db.query.transactions.findMany({
        where(fields, operators) {
          return operators.eq(fields.categoryId, targetId);
        },
      });
      expect(movedTransactions.length).toBeGreaterThan(0);
    });

    it('should reject when source includes target', async () => {
      const categoryId = testFixtures.categories[0].id;

      const response = await request(app)
        .post('/api/category/merge')
        .send({
          source: [categoryId],
          target: categoryId,
        });

      expect(response.status).toBe(HTTPStatusCode.BAD_REQUEST);
      expect(response.body.message).toContain('Source categories cannot include the target category');
    });

    it('should reject when categories belong to different users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const ownCategoryId = testFixtures.categories[0].id;
      const otherCategoryId = otherUserFixtures.categories[0].id;

      const response = await request(app)
        .post('/api/category/merge')
        .send({
          source: [ownCategoryId],
          target: otherCategoryId,
        });

      expect(response.status).toBe(HTTPStatusCode.BAD_REQUEST);
      expect(response.body.message).toContain('do not belong to the user');
    });
  });

  describe('GET /api/category/stats', () => {
    it('should return category statistics for a date range', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-31');

      const response = await request(app).get('/api/category/stats').query({
        from: from.toISOString(),
        to: to.toISOString(),
      });

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data.stats).toBeDefined();
      expect(Array.isArray(response.body.data.stats)).toBe(true);

      // Verify stats contain expected fields
      if (response.body.data.stats.length > 0) {
        const stat = response.body.data.stats[0];
        expect(stat).toHaveProperty('balance');
        expect(stat).toHaveProperty('income');
        expect(stat).toHaveProperty('expenses');
        expect(stat).toHaveProperty('category');
      }
    });

    it('should only return stats for authenticated user categories', async () => {
      await createTestFixtures(otherUserId);

      const response = await request(app)
        .get('/api/category/stats')
        .query({
          from: new Date('2024-01-01').toISOString(),
          to: new Date('2024-12-31').toISOString(),
        });

      expect(response.status).toBe(HTTPStatusCode.OK);
      // All stats should be for the authenticated user's categories
      for (const stat of response.body.data.stats) {
        const category = await db.query.categories.findFirst({
          where(fields, operators) {
            return operators.eq(fields.id, stat.category.id);
          },
        });
        expect(category?.ownerId).toBe(testUserId);
      }
    });
  });
});
