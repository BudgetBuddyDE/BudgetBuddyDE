import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { createTableSchemas } from "../utils/createTableSchemas";
import {
	attachments,
	budgetCategories,
	budgets,
	categories,
	paymentMethods,
	recurringPayments,
	transactions,
} from "./tables";

export { budgetType } from "./enums";

export const CategorySchemas = createTableSchemas(categories);

export const PaymentMethodSchemas = createTableSchemas(paymentMethods);

export const TransactionSchemas = createTableSchemas(transactions);

export const RecurringPaymentSchemas = createTableSchemas(recurringPayments);

export const AttachmentSchemas = createTableSchemas(attachments);

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
