import type {EntityKind, FinanceData} from '@/types/finance';

export type AppIntent =
  | {id: string; group: 'Navigate'; label: string; keywords: string[]; kind: 'navigate'; href: string}
  | {
      id: string;
      group: 'Create';
      label: string;
      keywords: string[];
      kind: 'create';
      entity: EntityKind | 'attachments';
      href: string;
    }
  | {
      id: string;
      group: 'Edit';
      label: string;
      keywords: string[];
      kind: 'edit';
      entity: EntityKind;
      entityId: string;
      href: string;
    }
  | {id: string; group: 'Reporting'; label: string; keywords: string[]; kind: 'report'; href: string}
  | {id: string; group: 'Account'; label: string; keywords: string[]; kind: 'account'; action: 'sign-out'};

export const CORE_INTENTS: AppIntent[] = [
  {
    id: 'open-dashboard',
    group: 'Navigate',
    label: 'Open dashboard',
    keywords: ['home', 'overview'],
    kind: 'navigate',
    href: '/dashboard',
  },
  {
    id: 'open-transactions',
    group: 'Navigate',
    label: 'Open transactions',
    keywords: ['payments', 'ledger'],
    kind: 'navigate',
    href: '/transactions',
  },
  {
    id: 'open-categories',
    group: 'Navigate',
    label: 'Open categories',
    keywords: ['groups'],
    kind: 'navigate',
    href: '/categories',
  },
  {
    id: 'open-payment-methods',
    group: 'Navigate',
    label: 'Open payment methods',
    keywords: ['accounts', 'cards'],
    kind: 'navigate',
    href: '/payment-methods',
  },
  {
    id: 'open-recurring',
    group: 'Navigate',
    label: 'Open recurring payments',
    keywords: ['subscriptions', 'scheduled'],
    kind: 'navigate',
    href: '/recurring-payments',
  },
  {
    id: 'open-budgets',
    group: 'Navigate',
    label: 'Open budgets',
    keywords: ['limits', 'targets'],
    kind: 'navigate',
    href: '/budgets',
  },
  {
    id: 'open-reporting',
    group: 'Navigate',
    label: 'Open reporting',
    keywords: ['analytics', 'insights'],
    kind: 'navigate',
    href: '/reporting',
  },
  {
    id: 'open-attachments',
    group: 'Navigate',
    label: 'Open attachments',
    keywords: ['receipts', 'files'],
    kind: 'navigate',
    href: '/attachments',
  },
  {
    id: 'open-settings',
    group: 'Navigate',
    label: 'Open settings',
    keywords: ['profile', 'sessions'],
    kind: 'navigate',
    href: '/settings/profile',
  },
  {
    id: 'create-transaction',
    group: 'Create',
    label: 'Create transaction',
    keywords: ['new', 'expense', 'income'],
    kind: 'create',
    entity: 'transactions',
    href: '/transactions?intent=create',
  },
  {
    id: 'create-category',
    group: 'Create',
    label: 'Create category',
    keywords: ['new', 'group'],
    kind: 'create',
    entity: 'categories',
    href: '/categories?intent=create',
  },
  {
    id: 'create-method',
    group: 'Create',
    label: 'Create payment method',
    keywords: ['new', 'account', 'card'],
    kind: 'create',
    entity: 'payment-methods',
    href: '/payment-methods?intent=create',
  },
  {
    id: 'create-recurring',
    group: 'Create',
    label: 'Create recurring payment',
    keywords: ['new', 'subscription'],
    kind: 'create',
    entity: 'recurring',
    href: '/recurring-payments?intent=create',
  },
  {
    id: 'create-budget',
    group: 'Create',
    label: 'Create budget',
    keywords: ['new', 'limit'],
    kind: 'create',
    entity: 'budgets',
    href: '/budgets?intent=create',
  },
  {
    id: 'create-attachment',
    group: 'Create',
    label: 'Upload attachment',
    keywords: ['new', 'receipt', 'file'],
    kind: 'create',
    entity: 'attachments',
    href: '/attachments?intent=upload',
  },
  {
    id: 'report-current-month',
    group: 'Reporting',
    label: 'Report: current month',
    keywords: ['analytics', 'now'],
    kind: 'report',
    href: '/reporting?period=month',
  },
  {
    id: 'report-current-year',
    group: 'Reporting',
    label: 'Report: current year',
    keywords: ['analytics', 'year'],
    kind: 'report',
    href: `/reporting?period=year&date=${new Date().toISOString().slice(0, 10)}`,
  },
  {
    id: 'sign-out',
    group: 'Account',
    label: 'Sign out',
    keywords: ['logout', 'account'],
    kind: 'account',
    action: 'sign-out',
  },
];

export function objectEditIntents(data: FinanceData): AppIntent[] {
  const categoryIntents: AppIntent[] = data.categories.map(item => ({
    id: `edit-category-${item.id}`,
    group: 'Edit',
    label: `Edit category · ${item.name}`,
    keywords: ['category', item.name],
    kind: 'edit',
    entity: 'categories',
    entityId: item.id,
    href: `/categories?intent=edit&id=${item.id}`,
  }));
  const methodIntents: AppIntent[] = data.paymentMethods.map(item => ({
    id: `edit-method-${item.id}`,
    group: 'Edit',
    label: `Edit payment method · ${item.name}`,
    keywords: ['payment method', item.name, item.provider],
    kind: 'edit',
    entity: 'payment-methods',
    entityId: item.id,
    href: `/payment-methods?intent=edit&id=${item.id}`,
  }));
  const transactionIntents: AppIntent[] = data.transactions.slice(0, 20).map(item => ({
    id: `edit-transaction-${item.id}`,
    group: 'Edit',
    label: `Edit transaction · ${item.receiver}`,
    keywords: ['transaction', item.receiver, item.categoryName],
    kind: 'edit',
    entity: 'transactions',
    entityId: item.id,
    href: `/transactions?intent=edit&id=${item.id}`,
  }));
  const recurringIntents: AppIntent[] = data.recurring.map(item => ({
    id: `edit-recurring-${item.id}`,
    group: 'Edit',
    label: `Edit recurring payment · ${item.receiver}`,
    keywords: ['recurring payment', 'subscription', item.receiver, item.categoryName],
    kind: 'edit',
    entity: 'recurring',
    entityId: item.id,
    href: `/recurring-payments?intent=edit&id=${item.id}`,
  }));
  const budgetIntents: AppIntent[] = data.budgets.map(item => ({
    id: `edit-budget-${item.id}`,
    group: 'Edit',
    label: `Edit budget · ${item.name}`,
    keywords: ['budget', 'limit', item.name, ...item.categoryNames],
    kind: 'edit',
    entity: 'budgets',
    entityId: item.id,
    href: `/budgets?intent=edit&id=${item.id}`,
  }));
  return [...categoryIntents, ...methodIntents, ...transactionIntents, ...recurringIntents, ...budgetIntents];
}

export function filterIntents(intents: AppIntent[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return intents;
  return intents.filter(intent =>
    [intent.label, ...intent.keywords].some(value => value.toLocaleLowerCase().includes(normalized)),
  );
}
