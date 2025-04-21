import {pgTable, unique, varchar} from 'drizzle-orm/pg-core';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

import {BaseColumns, DescriptionColumn, OwnerColumn, Tables} from './general';

export const PaymentMethods = pgTable(
  Tables.PAYMENT_METHODS,
  {
    ...BaseColumns,
    ...OwnerColumn, // FIXME: there should be a foreign key to the user table
    name: varchar('name', {length: 120}).notNull(),
    provider: varchar('provider', {length: 120}).notNull(),
    address: varchar('addres', {length: 120}).notNull(),
    ...DescriptionColumn,
  },
  t => ({
    uniqueName: unique().on(t.owner, t.name), // each user can have only one payment method with the same name
    uniqueProviderAddress: unique().on(t.provider, t.address),
  }),
);

export const ZPaymentMethod = createSelectSchema(PaymentMethods);
export type TPaymentMethod = z.infer<typeof ZPaymentMethod>;

export const ZInsertPaymentMethod = createInsertSchema(PaymentMethods, {
  name: string => string.nonempty(),
  provider: string => string.nonempty(),
  address: string => string.nonempty(),
  description: string => string.optional(),
});
export type TInsertPaymentMethod = z.infer<typeof ZInsertPaymentMethod>;
