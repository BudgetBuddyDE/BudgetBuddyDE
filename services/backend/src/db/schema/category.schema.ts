import {pgTable, unique, varchar} from 'drizzle-orm/pg-core';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

import {BaseColumns, DescriptionColumn, OwnerColumn, Tables} from './general';

export const Categories = pgTable(
  Tables.CATEGORIES,
  {
    ...BaseColumns,
    ...OwnerColumn, // FIXME: there should be a foreign key to the user table
    name: varchar('name', {length: 120}).notNull(),
    ...DescriptionColumn,
  },
  t => ({
    uniqueName: unique().on(t.owner, t.name), // each user can have only one category with the same name
  }),
);

export const ZCategory = createSelectSchema(Categories);
export type TCategory = z.infer<typeof ZCategory>;

export const ZInsertCategory = createInsertSchema(Categories, {
  name: string => string.nonempty(),
  description: string => string.optional(),
});
export type TInsertCategory = z.infer<typeof ZInsertCategory>;
