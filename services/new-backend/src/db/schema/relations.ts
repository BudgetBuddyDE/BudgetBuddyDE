import {
  categories,
  budgets,
  budgetCategories,
  transactions,
  paymentMethods,
  subscriptions,
  stockPositions,
  stockExchanges,
} from './tables';
import { relations } from 'drizzle-orm';

export const transactionRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [transactions.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [subscriptions.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const budgetCategoryRelations = relations(budgetCategories, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetCategories.budgetId],
    references: [budgets.id],
  }),
  category: one(categories, {
    fields: [budgetCategories.categoryId],
    references: [categories.id],
  }),
}));

export const stockPositionRelations = relations(stockPositions, ({ one }) => ({
  stockExchanges: one(stockExchanges, {
    fields: [stockPositions.stockExchangeSymbol],
    references: [stockExchanges.symbol],
  }),
}));
