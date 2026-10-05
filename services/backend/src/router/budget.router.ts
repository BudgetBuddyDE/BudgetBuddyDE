import {listOccurrenceDates} from '@budgetbuddyde/api/recurringPayment';
import {BudgetWithCategoriesSchema, recurringPayments, transactions} from '@budgetbuddyde/db/backend';
import {endOfMonth, format, startOfMonth} from 'date-fns';
import {fromZonedTime, toZonedTime} from 'date-fns-tz';
import {and, eq, gte, lte, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {config} from '../config';
import {db} from '../db';
import {paginationFields} from './pagination';
import * as budgetDomain from '../domain/budget';
import {sendDomainResponse} from '../domain/response';
import {ApiResponse, HTTPStatusCode} from '../models';

export const budgetRouter = Router();

// REVISIT: Cache the estimated budget result where possible.
budgetRouter.get('/estimated', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }

  const now = new Date();
  const zonedToday = toZonedTime(now, config.timezone);
  const today = format(zonedToday, 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(zonedToday), 'yyyy-MM-dd');
  const firstOfMonthInstant = fromZonedTime(startOfMonth(zonedToday), config.timezone);
  const endOfMonthInstant = fromZonedTime(endOfMonth(zonedToday), config.timezone);
  const [transactionTotals, activeRecurringPayments] = await Promise.all([
    db
      .select({
        paidExpenses:
          sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} <= 0 AND ${transactions.processedAt} <= ${now} THEN ABS(${transactions.transferAmount}) ELSE 0 END), 0)`.as(
            'paid_expenses',
          ),
        upcomingExpenses:
          sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} <= 0 AND ${transactions.processedAt} > ${now} THEN ABS(${transactions.transferAmount}) ELSE 0 END), 0)`.as(
            'upcoming_expenses',
          ),
        receivedIncome:
          sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} >= 0 AND ${transactions.processedAt} <= ${now} THEN ${transactions.transferAmount} ELSE 0 END), 0)`.as(
            'received_income',
          ),
        upcomingIncome:
          sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} >= 0 AND ${transactions.processedAt} > ${now} THEN ${transactions.transferAmount} ELSE 0 END), 0)`.as(
            'upcoming_income',
          ),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.ownerId, userId),
          gte(transactions.processedAt, firstOfMonthInstant),
          lte(transactions.processedAt, endOfMonthInstant),
        ),
      ),
    db.query.recurringPayments.findMany({
      where: and(
        eq(recurringPayments.ownerId, userId),
        eq(recurringPayments.paused, false),
        lte(recurringPayments.startsOn, monthEnd),
      ),
    }),
  ]);

  let upcomingRecurringExpenses = 0;
  let upcomingRecurringIncome = 0;
  for (const payment of activeRecurringPayments) {
    const occurrenceCount = listOccurrenceDates(payment, today, monthEnd).filter(date => date > today).length;
    if (payment.transferAmount < 0) upcomingRecurringExpenses += Math.abs(payment.transferAmount) * occurrenceCount;
    else upcomingRecurringIncome += payment.transferAmount * occurrenceCount;
  }

  const paidExpenses = transactionTotals[0].paidExpenses;
  const upcomingExpenses = transactionTotals[0].upcomingExpenses + upcomingRecurringExpenses;
  const receivedIncome = transactionTotals[0].receivedIncome;
  const upcomingIncome = transactionTotals[0].upcomingIncome + upcomingRecurringIncome;
  const freeAmount = receivedIncome + upcomingIncome - (paidExpenses + upcomingExpenses);
  ApiResponse.builder()
    .withData({
      expenses: {
        paid: paidExpenses,
        upcoming: upcomingExpenses,
      },
      income: {
        received: receivedIncome,
        upcoming: upcomingIncome,
      },
      freeAmount: freeAmount,
    })
    .buildAndSend(res);
});

// REVISIT: Cache budget responses where possible.
budgetRouter.get(
  '/',
  validateRequest({
    query: z.object({
      search: z.string().optional(),
      ...paginationFields,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const result = await budgetDomain.list(userId, req.query);
    sendDomainResponse(res, result);
  },
);

budgetRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: BudgetWithCategoriesSchema.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const result = await budgetDomain.get(userId, req.params.id);
    sendDomainResponse(res, result);
  },
);

budgetRouter.post(
  '/',
  validateRequest({
    body: BudgetWithCategoriesSchema.insert.omit({ownerId: true}).extend({
      ownerId: BudgetWithCategoriesSchema.insert.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const result = await budgetDomain.create(userId, req.body);
    sendDomainResponse(res, result);
  },
);

budgetRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: BudgetWithCategoriesSchema.select.shape.id,
    }),
    body: BudgetWithCategoriesSchema.update.omit({ownerId: true}).extend({
      ownerId: BudgetWithCategoriesSchema.update.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const result = await budgetDomain.update(userId, req.params.id, req.body);
    sendDomainResponse(res, result);
  },
);

budgetRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: BudgetWithCategoriesSchema.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const result = await budgetDomain.remove(userId, req.params.id);
    sendDomainResponse(res, result);
  },
);
