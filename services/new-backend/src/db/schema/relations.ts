import {relations} from 'drizzle-orm';
import {
  budgetCategories,
  budgets,
  categories,
  paymentMethods,
  recurringPayments,
  stockExchanges,
  stockPositions,
  transactions,
} from './tables';

export const transactionRelations = relations(transactions, ({one}) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [transactions.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const recurringPaymentRelations = relations(recurringPayments, ({one}) => ({
  category: one(categories, {
    fields: [recurringPayments.categoryId],
    references: [categories.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [recurringPayments.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const budgetRelations = relations(budgets, ({many}) => ({
  categories: many(budgetCategories),
}));

export const budgetCategoryRelations = relations(budgetCategories, ({one}) => ({
  budget: one(budgets, {
    fields: [budgetCategories.budgetId],
    references: [budgets.id],
  }),
  category: one(categories, {
    fields: [budgetCategories.categoryId],
    references: [categories.id],
  }),
}));

export const stockPositionRelations = relations(stockPositions, ({one}) => ({
  stockExchanges: one(stockExchanges, {
    fields: [stockPositions.stockExchangeSymbol],
    references: [stockExchanges.symbol],
  }),
}));
