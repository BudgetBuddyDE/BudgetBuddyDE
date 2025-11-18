import { uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { backendSchema } from './schema';

export const paymentMethods = backendSchema.table('paymentMethods', {
  id: uuid('payment_method_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  name: varchar({ length: 40 }).notNull(),
  provider: varchar({ length: 32 }).notNull(),
  address: varchar({ length: 32 }).notNull(),
  description: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
