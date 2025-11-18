import { uuid, varchar, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { paymentMethods } from './paymentMethods';
import { relations } from 'drizzle-orm';
import { backendSchema } from './schema';
import { subscriptions } from './subscriptions';

export const transactions = backendSchema.table('transactions', {
  id: uuid('transaction_id').primaryKey().defaultRandom(),
  ownerId: varchar().notNull(),
  categoryId: uuid('category_id')
    .references(() => categories.id)
    .notNull(),
  paymentMethodId: uuid('payment_method_id')
    .references(() => paymentMethods.id)
    .notNull(),
  processedAt: timestamp('processed_at').notNull(),
  receiver: varchar({ length: 100 }).notNull(),
  transferAmount: doublePrecision('transfer_amount').notNull(),
  information: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const transactionReceiverView = backendSchema.view('transaction_receiver_view').as((qb) =>
  qb
    .selectDistinct({
      receiver: transactions.receiver,
      ownerId: transactions.ownerId,
    })
    .from(transactions)
    .unionAll(
      qb
        .selectDistinct({
          receiver: subscriptions.receiver,
          ownerId: subscriptions.ownerId,
        })
        .from(subscriptions)
    )
);

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
