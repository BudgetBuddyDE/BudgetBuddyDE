import {and, eq, ilike, or, sql} from 'drizzle-orm';
import type {PgTableWithColumns, TableConfig} from 'drizzle-orm/pg-core';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {db} from '../db';
import {transactionReceiverView, transactions} from '../db/schema';
import {TransactionSchemas} from '../db/schema/types';
import {ApiResponse, HTTPStatusCode} from '../models';

export const transactionRouter = Router();

transactionRouter.get('/receiver', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }

  const records = await db
    .select({receiver: transactionReceiverView.receiver})
    .from(transactionReceiverView)
    .where(eq(transactionReceiverView.ownerId, userId));

  ApiResponse.builder<typeof records>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's receivers successfully")
    .withData(records)
    .withFrom('db')
    .buildAndSend(res);
});

transactionRouter.get(
  '/',
  validateRequest({
    query: z.object({
      search: z.string().optional(),
      from: z.coerce.number().optional(),
      to: z.coerce.number().optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    function assembleFilter<Table extends TableConfig>(
      table: PgTableWithColumns<Table>,
      {ownerColumnName, ownerValue}: {ownerColumnName: keyof Table['columns']; ownerValue: string},
      {searchTerm, searchableColumnName}: {searchTerm?: string; searchableColumnName?: (keyof Table['columns'])[]},
    ) {
      if (searchTerm && searchableColumnName) {
        return searchableColumnName.length > 1
          ? and(
              eq(table[ownerColumnName], ownerValue),
              or(
                ...searchableColumnName.map(columnName => {
                  const col = table[columnName];
                  return ilike(col, `%${searchTerm}%`);
                }),
              ),
            )
          : and(eq(table[ownerColumnName], ownerValue), ilike(table[searchableColumnName[0]], `%${searchTerm}%`));
      }
      return eq(table[ownerColumnName], ownerValue);
    }

    const filter = assembleFilter(
      transactions,
      {ownerColumnName: 'ownerId', ownerValue: userId},
      {
        searchTerm: req.query.search,
        searchableColumnName: ['receiver', 'information'],
      },
    );

    const [totalRecordCount, records] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`.as('count'),
        })
        .from(transactions)
        .where(filter)
        .limit(1),
      db.query.transactions.findMany({
        where() {
          return filter;
        },
        // extras(fields, operators) {
        //   return {
        //     totalCount: db.$count(transactions,filter).as('total_count'),
        //   }
        // },
        orderBy(fields, operators) {
          return [operators.desc(fields.processedAt), operators.desc(fields.createdAt)];
        },
        offset: req.query.from,
        limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
        with: {
          category: true,
          paymentMethod: true,
        },
      }),
    ]);

    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's transactions successfully")
      .withTotalCount(totalRecordCount[0].count)
      .withData(records)
      .withFrom('db')
      .buildAndSend(res);
  },
);

transactionRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;
    const records = await db.query.transactions.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
      with: {
        category: true,
        paymentMethod: true,
      },
    });

    if (!records) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Transaction ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's transaction successfully")
      .withData(records)
      .withFrom('db')
      .buildAndSend(res);
  },
);

transactionRouter.post(
  '/',
  validateRequest({
    body: TransactionSchemas.insert.omit({ownerId: true}).extend({
      ownerId: TransactionSchemas.insert.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const requestBody = [req.body].map(body => {
      body.ownerId = userId;
      return body as z.infer<typeof TransactionSchemas.insert>;
    });

    try {
      const createdRecords = await db.insert(transactions).values(requestBody).returning();
      if (createdRecords.length === 0) {
        throw new Error('No transaction created');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transaction created successfully')
        .withData(createdRecords)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

transactionRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
    body: TransactionSchemas.update.omit({ownerId: true}).extend({
      ownerId: TransactionSchemas.update.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const requestBody = req.body;
    requestBody.ownerId = userId;

    try {
      const updatedRecord = await db
        .update(transactions)
        .set(requestBody)
        .where(and(eq(transactions.ownerId, userId), eq(transactions.id, req.params.id)))
        .returning();
      if (updatedRecord.length === 0) {
        throw new Error('No transaction updated');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transaction updated successfully')
        .withData(updatedRecord)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

transactionRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;

    try {
      const deletedRecord = await db
        .delete(transactions)
        .where(and(eq(transactions.ownerId, userId), eq(transactions.id, entityId)))
        .returning();
      if (deletedRecord.length === 0) {
        throw new Error('No transaction deleted');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transaction deleted successfully')
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);
