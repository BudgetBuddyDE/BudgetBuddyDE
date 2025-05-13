import {boolean, doublePrecision, integer, pgTable} from 'drizzle-orm/pg-core';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

import {Categories} from './category.schema';
import {BaseColumns, DescriptionColumn, OwnerColumn, Tables} from './general';
import {PaymentMethods} from './paymentMethod.schema';

export const Subscriptions = pgTable(Tables.SUBSCRIPTIONS, {
  ...BaseColumns,
  ...OwnerColumn, // FIXME: there should be a foreign key to the user table
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
  paused: boolean('paused').default(false).notNull(),
  exexcuteAt: integer('executeAt').notNull(),
  transferAmount: doublePrecision('transferAmount').notNull(),
  ...DescriptionColumn,
});

export const ZSubscription = createSelectSchema(Subscriptions);
export type TSubscription = z.infer<typeof ZSubscription>;

export const ZInsertSubscription = createInsertSchema(Subscriptions, {
  owner: owner => owner.nonempty(),
  category: number => number,
  paymentMethod: number => number,
  paused: boolean => boolean,
  exexcuteAt: integer =>
    integer
      .positive('Needs to be an positive number')
      .min(1, "Can't be smaller than 1")
      .max(31, "Can't be greater than 31"),
  transferAmount: doublePrecision => doublePrecision,
  description: string => string.optional(),
});
export type TInsertSubscription = z.infer<typeof ZInsertSubscription>;

export const ZUpdateSubscription = z.object({
  owner: ZInsertSubscription.shape.owner,
  category: ZInsertSubscription.shape.category,
  paymentMethod: ZInsertSubscription.shape.paymentMethod,
  paused: ZInsertSubscription.shape.paused,
  executeAt: ZInsertSubscription.shape.exexcuteAt,
  transferAmount: ZInsertSubscription.shape.transferAmount,
  description: ZInsertSubscription.shape.description,
});
export type TUpdateSubscription = z.infer<typeof ZUpdateSubscription>;
