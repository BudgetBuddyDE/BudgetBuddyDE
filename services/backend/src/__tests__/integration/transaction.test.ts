import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {db} from '../../db';
import {HTTPStatusCode} from '../../models';
import {transactionRouter} from '../../router/transaction.router';
import {cleanupTestData, createTestFixtures, generateTestUserId, mockAuthMiddleware} from '../helpers';

describe('Transaction Router Integration Tests', () => {
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
    app.use('/api/transaction', transactionRouter);
  });

  afterEach(async () => {
    await cleanupTestData(testUserId);
    await cleanupTestData(otherUserId);
  });

  describe('GET /api/transaction', () => {
    it('should return all transactions for the authenticated user', async () => {
      const response = await request(app).get('/api/transaction');

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.totalCount).toBe(2);
    });

    it('should filter transactions by search term', async () => {
      const response = await request(app).get('/api/transaction').query({search: 'Supermarket'});

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].receiver).toBe('Supermarket');
    });

    it('should filter transactions by date range', async () => {
      const response = await request(app)
        .get('/api/transaction')
        .query({
          $dateFrom: new Date('2024-01-14').toISOString(),
          $dateTo: new Date('2024-01-16').toISOString(),
        });

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].receiver).toBe('Supermarket');
    });

    it('should support pagination', async () => {
      const response = await request(app).get('/api/transaction').query({from: 0, to: 1});

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.totalCount).toBe(2);
    });

    it('should only return transactions belonging to the authenticated user', async () => {
      await createTestFixtures(otherUserId);

      const response = await request(app).get('/api/transaction');

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(2);
      for (const transaction of response.body.data) {
        expect(transaction.ownerId).toBe(testUserId);
      }
    });

    it('should include related category and payment method data', async () => {
      const response = await request(app).get('/api/transaction');

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data[0]).toHaveProperty('category');
      expect(response.body.data[0]).toHaveProperty('paymentMethod');
      expect(response.body.data[0].category).toHaveProperty('name');
      expect(response.body.data[0].paymentMethod).toHaveProperty('name');
    });
  });

  describe('GET /api/transaction/:id', () => {
    it('should return a specific transaction by ID', async () => {
      const transactionId = testFixtures.transactions[0].id;
      const response = await request(app).get(`/api/transaction/${transactionId}`);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data.id).toBe(transactionId);
      expect(response.body.data.receiver).toBe('Supermarket');
    });

    it('should return 404 when transaction does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/transaction/${nonExistentId}`);

      expect(response.status).toBe(HTTPStatusCode.NOT_FOUND);
    });

    it('should not allow access to transactions from other users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherTransactionId = otherUserFixtures.transactions[0].id;

      const response = await request(app).get(`/api/transaction/${otherTransactionId}`);

      expect(response.status).toBe(HTTPStatusCode.NOT_FOUND);
    });
  });

  describe('POST /api/transaction', () => {
    it('should create a new transaction', async () => {
      const newTransaction = {
        categoryId: testFixtures.categories[0].id,
        paymentMethodId: testFixtures.paymentMethods[0].id,
        processedAt: new Date('2024-01-25'),
        receiver: 'Test Receiver',
        transferAmount: -100.0,
        information: 'Test transaction',
      };

      const response = await request(app).post('/api/transaction').send(newTransaction);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].receiver).toBe('Test Receiver');
      expect(response.body.data[0].ownerId).toBe(testUserId);

      const created = await db.query.transactions.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, response.body.data[0].id);
        },
      });
      expect(created).toBeDefined();
    });

    it('should automatically set ownerId to authenticated user', async () => {
      const newTransaction = {
        categoryId: testFixtures.categories[0].id,
        paymentMethodId: testFixtures.paymentMethods[0].id,
        processedAt: new Date(),
        receiver: 'Test',
        transferAmount: -50.0,
      };

      const response = await request(app).post('/api/transaction').send(newTransaction);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data[0].ownerId).toBe(testUserId);
    });

    it('should reject transaction with invalid category', async () => {
      const invalidTransaction = {
        categoryId: '00000000-0000-0000-0000-000000000000',
        paymentMethodId: testFixtures.paymentMethods[0].id,
        processedAt: new Date(),
        receiver: 'Test',
        transferAmount: -50.0,
      };

      const response = await request(app).post('/api/transaction').send(invalidTransaction);

      expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('PUT /api/transaction/:id', () => {
    it('should update an existing transaction', async () => {
      const transactionId = testFixtures.transactions[0].id;
      const transaction = testFixtures.transactions[0];
      const updates = {
        categoryId: transaction.categoryId,
        paymentMethodId: transaction.paymentMethodId,
        processedAt: transaction.processedAt,
        receiver: 'Updated Receiver',
        transferAmount: -75.0,
      };

      const response = await request(app).put(`/api/transaction/${transactionId}`).send(updates);

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data[0].receiver).toBe('Updated Receiver');

      const updated = await db.query.transactions.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, transactionId);
        },
      });
      expect(updated?.receiver).toBe('Updated Receiver');
      expect(updated?.transferAmount).toBe(-75.0);
    });

    it('should not allow updating transactions from other users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherTransactionId = otherUserFixtures.transactions[0].id;
      const otherTransaction = otherUserFixtures.transactions[0];

      const response = await request(app).put(`/api/transaction/${otherTransactionId}`).send({
        categoryId: otherTransaction.categoryId,
        paymentMethodId: otherTransaction.paymentMethodId,
        processedAt: otherTransaction.processedAt,
        receiver: 'Hacked',
      });

      expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);

      const transaction = await db.query.transactions.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, otherTransactionId);
        },
      });
      expect(transaction?.receiver).not.toBe('Hacked');
    });
  });

  describe('DELETE /api/transaction/:id', () => {
    it('should delete an existing transaction', async () => {
      const transactionId = testFixtures.transactions[0].id;

      const response = await request(app).delete(`/api/transaction/${transactionId}`);

      expect(response.status).toBe(HTTPStatusCode.OK);

      const deleted = await db.query.transactions.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, transactionId);
        },
      });
      expect(deleted).toBeUndefined();
    });

    it('should not allow deleting transactions from other users', async () => {
      const otherUserFixtures = await createTestFixtures(otherUserId);
      const otherTransactionId = otherUserFixtures.transactions[0].id;

      const response = await request(app).delete(`/api/transaction/${otherTransactionId}`);

      expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);

      const transaction = await db.query.transactions.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, otherTransactionId);
        },
      });
      expect(transaction).toBeDefined();
    });
  });

  describe('GET /api/transaction/receiver', () => {
    it('should return list of unique receivers for the user', async () => {
      const response = await request(app).get('/api/transaction/receiver');

      expect(response.status).toBe(HTTPStatusCode.OK);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should only return receivers from authenticated user transactions', async () => {
      await createTestFixtures(otherUserId);

      const response = await request(app).get('/api/transaction/receiver');

      expect(response.status).toBe(HTTPStatusCode.OK);
      const receivers = response.body.data.map((r: {receiver: string}) => r.receiver);
      expect(receivers).toContain('Supermarket');
      expect(receivers).toContain('Cinema');
    });
  });

  describe('Income and Expense Calculations', () => {
    it('should correctly calculate negative amounts as expenses', async () => {
      const response = await request(app).get('/api/transaction');

      expect(response.status).toBe(HTTPStatusCode.OK);
      const expenseTransactions = response.body.data.filter((t: {transferAmount: number}) => t.transferAmount < 0);
      expect(expenseTransactions.length).toBeGreaterThan(0);
      for (const transaction of expenseTransactions) {
        expect(transaction.transferAmount).toBeLessThan(0);
      }
    });

    it('should handle positive amounts as income', async () => {
      // Create an income transaction
      const incomeTransaction = {
        categoryId: testFixtures.categories[0].id,
        paymentMethodId: testFixtures.paymentMethods[0].id,
        processedAt: new Date(),
        receiver: 'Employer',
        transferAmount: 2500.0,
        information: 'Monthly salary',
      };

      await request(app).post('/api/transaction').send(incomeTransaction);

      const response = await request(app).get('/api/transaction');
      const incomeTransactions = response.body.data.filter((t: {transferAmount: number}) => t.transferAmount > 0);
      expect(incomeTransactions.length).toBeGreaterThan(0);
      expect(incomeTransactions[0].transferAmount).toBeGreaterThan(0);
    });
  });
});
