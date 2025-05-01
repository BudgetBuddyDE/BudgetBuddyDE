import {serial, text, timestamp} from 'drizzle-orm/pg-core';

import {user} from './auth';

export const Tables = {
  USERS: 'user',
  ACCOUNTS: 'account',
  SESSIONS: 'session',
  VERIFICATIONS: 'verfication',
  CATEGORIES: 'category',
  PAYMENT_METHODS: 'payment_method',
  TRANSACTIONS: 'translation',
  SUBSCRIPTIONS: 'subscription',
  BUDGETS: 'budget',
  BUDGET_CATEGORIES: 'budget_categorie',
  NEWSLETTERS: 'newsletter',
  NEWSLETTER_SUBSCRIPTIONS: 'newsletter_subscription',
  STOCK_EXCHANGES: 'stock_exchange',
  STOCK_POSITIONS: 'stock_position',
  STOCK_WATCHLISTS: 'stock_watchlist',
} as const;

export const UpdatedAtColumn = {
  updatedAt: timestamp('updatedAt')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const CreatedAtColumn = {createdAt: timestamp('createdAt').defaultNow()};

export const BaseColumns = {
  id: serial('id').primaryKey(),
  // id: uuid('id').defaultRandom(),
  ...CreatedAtColumn,
  ...UpdatedAtColumn,
};

export const OwnerColumn = {
  owner: text('ownerId')
    .references(() => user.id, {
      onDelete: 'cascade',
    })
    .notNull(),
};

export const DescriptionColumn = {description: text('description')};
