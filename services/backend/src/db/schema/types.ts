import type {Table} from 'drizzle-orm';
import {createInsertSchema, createSelectSchema, createUpdateSchema} from 'drizzle-zod';
import {z} from 'zod';
import {
  attachments,
  budgetCategories,
  budgets,
  categories,
  paymentMethods,
  recurringPayments,
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

export const AttachmentSchema = createTableSchemas(attachments);

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
