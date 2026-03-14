import { relations } from "drizzle-orm";
import { user } from "../auth/tables";
import {
	attachments,
	budgetCategories,
	budgets,
	categories,
	paymentMethods,
	recurringPayments,
	transactionAttachments,
	transactions,
} from "./tables";

export const transactionRelations = relations(
	transactions,
	({ one, many }) => ({
		owner: one(user, {
			fields: [transactions.ownerId],
			references: [user.id],
		}),
		category: one(categories, {
			fields: [transactions.categoryId],
			references: [categories.id],
		}),
		paymentMethod: one(paymentMethods, {
			fields: [transactions.paymentMethodId],
			references: [paymentMethods.id],
		}),
		attachments: many(transactionAttachments),
	}),
);

export const recurringPaymentRelations = relations(
	recurringPayments,
	({ one }) => ({
		owner: one(user, {
			fields: [recurringPayments.ownerId],
			references: [user.id],
		}),
		category: one(categories, {
			fields: [recurringPayments.categoryId],
			references: [categories.id],
		}),
		paymentMethod: one(paymentMethods, {
			fields: [recurringPayments.paymentMethodId],
			references: [paymentMethods.id],
		}),
	}),
);

export const budgetRelations = relations(budgets, ({ one, many }) => ({
	owner: one(user, {
		fields: [budgets.ownerId],
		references: [user.id],
	}),
	categories: many(budgetCategories),
}));

export const paymentMethodRelations = relations(paymentMethods, ({ one }) => ({
	owner: one(user, {
		fields: [paymentMethods.ownerId],
		references: [user.id],
	}),
}));

export const categoryRelations = relations(categories, ({ one }) => ({
	owner: one(user, {
		fields: [categories.ownerId],
		references: [user.id],
	}),
}));

export const budgetCategoryRelations = relations(
	budgetCategories,
	({ one }) => ({
		budget: one(budgets, {
			fields: [budgetCategories.budgetId],
			references: [budgets.id],
		}),
		category: one(categories, {
			fields: [budgetCategories.categoryId],
			references: [categories.id],
		}),
	}),
);

export const transactionAttachmentRelations = relations(
	transactionAttachments,
	({ one }) => ({
		transaction: one(transactions, {
			fields: [transactionAttachments.transactionId],
			references: [transactions.id],
		}),
		attachment: one(attachments, {
			fields: [transactionAttachments.attachmentId],
			references: [attachments.id],
		}),
	}),
);

export const attachmentRelations = relations(attachments, ({ many }) => ({
	transactions: many(transactionAttachments),
}));
