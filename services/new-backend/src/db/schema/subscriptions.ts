import { uuid, varchar, text, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { paymentMethods } from './paymentMethods';
import { relations } from 'drizzle-orm';
import { backendSchema } from './schema';

export const subscriptions = backendSchema.table('subscriptions', {
  id: uuid('subscription_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  categoryId: uuid('category_id')
    .references(() => categories.id)
    .notNull(),
  paymentMethodId: uuid('payment_method_id')
    .references(() => paymentMethods.id)
    .notNull(),
  executeAt: timestamp('execute_at').notNull(),
  paused: boolean('paused').default(false).notNull(),
  receiver: varchar({ length: 100 }).notNull(),
  transferAmount: doublePrecision('transfer_amount').notNull(),
  information: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

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
