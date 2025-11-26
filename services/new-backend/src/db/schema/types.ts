import type {Table} from 'drizzle-orm';
import {createInsertSchema, createSelectSchema, createUpdateSchema} from 'drizzle-zod';
import {z} from 'zod';
import {
  budgetCategories,
  budgets,
  categories,
  paymentMethods,
  recurringPayments,
  stockPositions,
  transactions,
} from './tables';

function createTableSchemas<T extends Table>(table: T) {
  return {
    select: createSelectSchema(table),
    insert: createInsertSchema(table),
    update: createUpdateSchema(table),
  };
}

export const CategorySchemas = createTableSchemas(categories);

export const PaymentMethodSchemas = createTableSchemas(paymentMethods);

export const TransactionSchemas = createTableSchemas(transactions);

export const RecurringPaymentSchemas = createTableSchemas(recurringPayments);

/**
 * @deprecated
 */
export const BudgetSchemas = createTableSchemas(budgets);
/**
 * @deprecated
 */
export const BudgetCategorySchemas = createTableSchemas(budgetCategories);
// REVISIT:
export const BudgetWithCategoriesSchema = {
  select: createSelectSchema(budgets),
  insert: createInsertSchema(budgets).extend({
    categories: z.array(z.string()),
  }),
  update: createUpdateSchema(budgets).extend({
    categories: z.array(z.string()),
  }),
};

export const StockPositionSchemas = createTableSchemas(stockPositions);
