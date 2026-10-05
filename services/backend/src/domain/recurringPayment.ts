import {Category} from '@budgetbuddyde/api/category';
import {PaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {listOccurrenceDates} from '@budgetbuddyde/api/recurringPayment';
import {RecurringPaymentSchemas, recurringPayments} from '@budgetbuddyde/db/backend';
import {and, eq, inArray, lte, notInArray, sql} from 'drizzle-orm';
import z from 'zod';
import {invalidateDomainMutation} from './cache';
import {db} from '../db';
import {ApiResponse, HTTPStatusCode, NotFoundError} from '../models';
import {assembleFilter, type TAdditionalFilter} from '../router/assembleFilter';
import {hasAllOwnedIds, ownedIdsFinder} from '../router/batch';
import {paginationFields, paginationWindow, refinePagination} from '../router/pagination';
const categoryAndPaymentMethodFilters = {
  $categories: z
    .array(Category.shape.id)
    .or(Category.shape.id)
    .transform(value => (Array.isArray(value) ? value : [value]))
    .optional(),
  $excl_categories: z
    .array(Category.shape.id)
    .or(Category.shape.id)
    .transform(value => (Array.isArray(value) ? value : [value]))
    .optional(),
  $paymentMethods: z
    .array(PaymentMethod.shape.id)
    .or(PaymentMethod.shape.id)
    .transform(value => (Array.isArray(value) ? value : [value]))
    .optional(),
  $excl_paymentMethods: z
    .array(PaymentMethod.shape.id)
    .or(PaymentMethod.shape.id)
    .transform(value => (Array.isArray(value) ? value : [value]))
    .optional(),
};

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .pipe(z.iso.date());

export const recurringPaymentOccurrencesQuerySchema = z
  .object({
    ...paginationFields,
    ...categoryAndPaymentMethodFilters,
    $dateFrom: dateOnlySchema,
    $dateTo: dateOnlySchema,
    $includePaused: z.boolean().or(z.stringbool()).default(false),
  })
  .superRefine((query, context) => {
    refinePagination(query, context);
    const fromDay = Date.parse(`${query.$dateFrom}T00:00:00Z`) / 86_400_000;
    const toDay = Date.parse(`${query.$dateTo}T00:00:00Z`) / 86_400_000;
    if (fromDay > toDay) {
      context.addIssue({code: 'custom', path: ['$dateTo'], message: '$dateTo must be on or after $dateFrom'});
    } else if (toDay - fromDay > 365) {
      context.addIssue({code: 'custom', path: ['$dateTo'], message: 'Date range must not exceed 366 days'});
    }
  });

export const createRecurringPaymentSchema = RecurringPaymentSchemas.insert.omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});
export const updateRecurringPaymentSchema = RecurringPaymentSchemas.update.omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export function expandRecurringPaymentOccurrences<T extends Parameters<typeof listOccurrenceDates>[0] & {id: string}>(
  payments: readonly T[],
  dateFrom: string,
  dateTo: string,
) {
  return payments
    .flatMap(recurringPayment =>
      listOccurrenceDates(recurringPayment, dateFrom, dateTo).map(scheduledFor => ({
        scheduledFor,
        recurringPayment,
      })),
    )
    .sort(
      (left, right) =>
        left.scheduledFor.localeCompare(right.scheduledFor) ||
        left.recurringPayment.id.localeCompare(right.recurringPayment.id),
    );
}

export const recurringPaymentListSchema = z
  .object({
    search: z.string().optional(),
    ...paginationFields,
    ...categoryAndPaymentMethodFilters,
    $paused: z.boolean().or(z.stringbool()).optional(),
  })
  .superRefine(refinePagination);

export async function listRecurringPayments(userId: string, input: z.input<typeof recurringPaymentListSchema> = {}) {
  const parsedInput = recurringPaymentListSchema.parse(input);

  const query = parsedInput;
  const additionalFilters: TAdditionalFilter<(typeof recurringPayments)['_']['config']>[] = [];
  if (query.$paused !== undefined) {
    additionalFilters.push({columnName: 'paused', operator: 'eq', value: query.$paused});
  }
  if (query.$categories) {
    additionalFilters.push({columnName: 'categoryId', operator: 'in', value: query.$categories});
  }
  if (query.$excl_categories) {
    additionalFilters.push({columnName: 'categoryId', operator: 'notIn', value: query.$excl_categories});
  }
  if (query.$paymentMethods) {
    additionalFilters.push({columnName: 'paymentMethodId', operator: 'in', value: query.$paymentMethods});
  }
  if (query.$excl_paymentMethods) {
    additionalFilters.push({columnName: 'paymentMethodId', operator: 'notIn', value: query.$excl_paymentMethods});
  }
  const filter = assembleFilter(
    recurringPayments,
    {ownerColumnName: 'ownerId', ownerValue: userId},
    {
      searchTerm: query.search,
      searchableColumnName: ['receiver', 'information'],
    },
    additionalFilters,
  );

  const [[{count: totalCount}], records] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`.as('count'),
      })
      .from(recurringPayments)
      .where(filter)
      .limit(1),
    db.query.recurringPayments.findMany({
      where() {
        return filter;
      },
      orderBy(fields, operators) {
        return [operators.asc(fields.startsOn), operators.desc(fields.updatedAt)];
      },
      ...paginationWindow(parsedInput),
      with: {
        category: true,
        paymentMethod: true,
      },
    }),
  ]);

  return ApiResponse.builder<typeof records>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's recurring payments successfully")
    .withTotalCount(totalCount)
    .withData(records)
    .withFrom('db')
    .build();
}

export async function listRecurringPaymentOccurrences(
  userId: string,
  input: z.input<typeof recurringPaymentOccurrencesQuerySchema>,
) {
  const parsedInput = recurringPaymentOccurrencesQuerySchema.parse(input);

  const query = parsedInput;
  const filters = [eq(recurringPayments.ownerId, userId), lte(recurringPayments.startsOn, query.$dateTo)];
  if (!query.$includePaused) filters.push(eq(recurringPayments.paused, false));
  if (query.$categories) filters.push(inArray(recurringPayments.categoryId, query.$categories));
  if (query.$excl_categories) filters.push(notInArray(recurringPayments.categoryId, query.$excl_categories));
  if (query.$paymentMethods) filters.push(inArray(recurringPayments.paymentMethodId, query.$paymentMethods));
  if (query.$excl_paymentMethods) {
    filters.push(notInArray(recurringPayments.paymentMethodId, query.$excl_paymentMethods));
  }

  const payments = await db.query.recurringPayments.findMany({
    where: and(...filters),
    with: {category: true, paymentMethod: true},
  });
  const occurrences = expandRecurringPaymentOccurrences(payments, query.$dateFrom, query.$dateTo);
  const totalCount = occurrences.length;
  const from = query.from ?? 0;
  const records = occurrences.slice(from, query.to ?? from + 50);

  return ApiResponse.builder<typeof records>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's recurring payment occurrences successfully")
    .withTotalCount(totalCount)
    .withData(records)
    .withFrom('db')
    .build();
}

export async function getRecurringPayment(userId: string, entityIdInput: string) {
  RecurringPaymentSchemas.select.shape.id.parse(entityIdInput);
  const entityId = entityIdInput;
  const records = await db.query.recurringPayments.findFirst({
    where(fields, operators) {
      return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
    },
    with: {
      category: true,
      paymentMethod: true,
    },
  });
  if (!records) {
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.NOT_FOUND)
      .withMessage(`Recurring payment ${entityId} not found`)
      .withFrom('db')
      .build();
  }
  return ApiResponse.builder<typeof records>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's recurring payment successfully")
    .withData(records)
    .withFrom('db')
    .build();
}

export async function createRecurringPayment(userId: string, input: z.input<typeof createRecurringPaymentSchema>) {
  const parsedInput = createRecurringPaymentSchema.parse(input);
  const [categoryOwned, paymentMethodOwned] = await Promise.all([
    hasAllOwnedIds(userId, [parsedInput.categoryId], ownedIdsFinder(db.query.categories)),
    hasAllOwnedIds(userId, [parsedInput.paymentMethodId], ownedIdsFinder(db.query.paymentMethods)),
  ]);
  if (!categoryOwned || !paymentMethodOwned) {
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.BAD_REQUEST)
      .withMessage('Referenced category or payment method is invalid')
      .build();
  }

  try {
    const createdRecords = await db
      .insert(recurringPayments)
      .values({...parsedInput, ownerId: userId})
      .returning();
    if (createdRecords.length === 0) {
      throw new Error('No recurring payment created');
    }
    await invalidateDomainMutation(userId, '/api/recurringPayment');
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Recurring payment created successfully')
      .withData(createdRecords)
      .withFrom('db')
      .build();
  } catch (err) {
    return ApiResponse.builder()
      .fromError(err instanceof Error ? err : new Error(String(err)))
      .build();
  }
}

export async function updateRecurringPayment(
  userId: string,
  entityIdInput: string,
  input: z.input<typeof updateRecurringPaymentSchema>,
) {
  RecurringPaymentSchemas.select.shape.id.parse(entityIdInput);
  const parsedInput = updateRecurringPaymentSchema.parse(input);
  const [categoryOwned, paymentMethodOwned] = await Promise.all([
    hasAllOwnedIds(userId, parsedInput.categoryId ? [parsedInput.categoryId] : [], ownedIdsFinder(db.query.categories)),
    hasAllOwnedIds(
      userId,
      parsedInput.paymentMethodId ? [parsedInput.paymentMethodId] : [],
      ownedIdsFinder(db.query.paymentMethods),
    ),
  ]);
  if (!categoryOwned || !paymentMethodOwned) {
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.BAD_REQUEST)
      .withMessage('Referenced category or payment method is invalid')
      .build();
  }

  try {
    const updatedRecord = await db
      .update(recurringPayments)
      .set(parsedInput)
      .where(and(eq(recurringPayments.ownerId, userId), eq(recurringPayments.id, entityIdInput)))
      .returning();
    if (updatedRecord.length === 0) {
      throw new NotFoundError('Recurring payment not found');
    }
    await invalidateDomainMutation(userId, '/api/recurringPayment');
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Recurring payment updated successfully')
      .withData(updatedRecord)
      .withFrom('db')
      .build();
  } catch (err) {
    return ApiResponse.builder()
      .fromError(err instanceof Error ? err : new Error(String(err)))
      .build();
  }
}

export async function removeRecurringPayment(userId: string, entityIdInput: string) {
  RecurringPaymentSchemas.select.shape.id.parse(entityIdInput);
  const entityId = entityIdInput;
  try {
    const deletedRecord = await db
      .delete(recurringPayments)
      .where(and(eq(recurringPayments.ownerId, userId), eq(recurringPayments.id, entityId)))
      .returning();
    if (deletedRecord.length === 0) {
      throw new NotFoundError('Recurring payment not found');
    }
    await invalidateDomainMutation(userId, '/api/recurringPayment');
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Recurring payment deleted successfully')
      .withFrom('db')
      .build();
  } catch (err) {
    return ApiResponse.builder()
      .fromError(err instanceof Error ? err : new Error(String(err)))
      .build();
  }
}
