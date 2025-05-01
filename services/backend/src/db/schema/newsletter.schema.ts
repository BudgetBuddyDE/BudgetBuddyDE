import {boolean, pgTable, varchar} from 'drizzle-orm/pg-core';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

import {CreatedAtColumn, DescriptionColumn, OwnerColumn, Tables, UpdatedAtColumn} from './general';

const NewsletterKey = varchar('newsletter', {length: 30});

export const Newsletters = pgTable(Tables.NEWSLETTERS, {
  newsletter: NewsletterKey.primaryKey().notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  name: varchar('name', {length: 30}).notNull(),
  ...DescriptionColumn,
  ...CreatedAtColumn,
  ...UpdatedAtColumn,
});

export const ZNewsletter = createSelectSchema(Newsletters);
export type TNewsletter = z.infer<typeof ZNewsletter>;

export const ZInsertNewsletter = createInsertSchema(Newsletters, {
  newsletter: s => s.nonempty(),
  enabled: s => s,
  name: s => s,
  description: s => s.optional(),
});
export type TInsertNewsletter = z.infer<typeof ZInsertNewsletter>;

export const NewsletterSubscriptions = pgTable(Tables.NEWSLETTER_SUBSCRIPTIONS, {
  ...OwnerColumn,
  newsletter: NewsletterKey.references(() => Newsletters.newsletter, {
    onDelete: 'cascade',
  }).notNull(),
});

export const ZNewsletterSubscription = createSelectSchema(NewsletterSubscriptions);
export type TNewsletterSubscription = z.infer<typeof ZNewsletterSubscription>;

export const ZInsertNewsletterSubscription = createInsertSchema(NewsletterSubscriptions, {
  owner: string => string.nonempty(),
  newsletter: string => string.nonempty(),
});
export type TInsertNewsletterSubscription = z.infer<typeof ZInsertNewsletterSubscription>;
