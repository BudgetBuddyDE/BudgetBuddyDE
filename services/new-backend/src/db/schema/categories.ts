import { uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { backendSchema } from './schema';

export const categories = backendSchema.table('categories', {
  id: uuid('category_id').primaryKey().defaultRandom(),
  owner: varchar('owner_id').notNull(),
  name: varchar({ length: 40 }).notNull(),
  description: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
