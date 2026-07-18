import type {IntentAction, IntentEntity} from './types';

export type IntentTargetConfig = {
  route: string;
  createRoute?: string;
  label: string;
  pluralLabel: string;
  actions: readonly IntentAction[];
};

export const IBN_TARGETS = {
  transaction: {
    route: '/transactions',
    label: 'Transaction',
    pluralLabel: 'Transactions',
    actions: ['create', 'edit', 'delete'],
  },
  recurringPayment: {
    route: '/recurringPayments',
    label: 'Recurring Payment',
    pluralLabel: 'Recurring Payments',
    actions: ['create', 'edit', 'delete'],
  },
  paymentMethod: {
    route: '/paymentMethods',
    label: 'Payment Method',
    pluralLabel: 'Payment Methods',
    actions: ['create', 'edit', 'delete'],
  },
  category: {
    route: '/categories',
    label: 'Category',
    pluralLabel: 'Categories',
    actions: ['create', 'edit', 'delete'],
  },
  budget: {
    route: '/dashboard/budget',
    label: 'Budget',
    pluralLabel: 'Budgets',
    actions: ['create', 'edit', 'delete'],
  },
  attachment: {
    route: '/attachments',
    createRoute: '/transactions',
    label: 'Attachment',
    pluralLabel: 'Attachments',
    actions: ['create', 'delete'],
  },
  apiKey: {
    route: '/settings/api-keys',
    label: 'API Key',
    pluralLabel: 'API Keys',
    actions: ['create', 'delete'],
  },
} as const satisfies Record<IntentEntity, IntentTargetConfig>;
