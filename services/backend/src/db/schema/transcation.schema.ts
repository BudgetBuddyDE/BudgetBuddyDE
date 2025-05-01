import {doublePrecision, integer, pgTable, timestamp, varchar} from 'drizzle-orm/pg-core';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

import {Categories} from './category.schema';
import {BaseColumns, DescriptionColumn, OwnerColumn, Tables} from './general';
import {PaymentMethods} from './paymentMethod.schema';

export const Transactions = pgTable(Tables.TRANSACTIONS, {
  ...BaseColumns,
  ...OwnerColumn,
  category: integer('categoryId')
    .references(() => Categories.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  paymentMethod: integer('paymentMethodId')
    .references(() => PaymentMethods.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  processedAt: timestamp('processedAt').notNull(),
  receiver: varchar('receiver', {length: 120}).notNull(),
  transferAmount: doublePrecision('transferAmount').notNull(),
  ...DescriptionColumn,
});

export const ZTransaction = createSelectSchema(Transactions);
export type TTransaction = z.infer<typeof ZTransaction>;

export const ZInsertTransaction = createInsertSchema(Transactions, {
  category: number => number,
  paymentMethod: number => number,
  processedAt: timestamp => timestamp,
  receiver: string => string.nonempty(),
  transferAmount: doublePrecision => doublePrecision,
  description: string => string.optional(),
});
export type TInsertTransaction = z.infer<typeof ZInsertTransaction>;
