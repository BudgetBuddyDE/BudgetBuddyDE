import type {
  BudgetView,
  CategoryView,
  EntityKind,
  PaymentMethodView,
  RecurringPaymentView,
  TransactionView,
} from '@/types/finance';

export const ENTITY_META: Record<EntityKind, {title: string; singular: string; description: string}> = {
  transactions: {
    title: 'Transactions',
    singular: 'transaction',
    description: 'Review, filter, and maintain every movement of money.',
  },
  categories: {
    title: 'Categories',
    singular: 'category',
    description: 'Keep your financial taxonomy clear and consistent.',
  },
  'payment-methods': {
    title: 'Payment methods',
    singular: 'payment method',
    description: 'Manage the accounts and cards used for your transactions.',
  },
  recurring: {
    title: 'Recurring payments',
    singular: 'recurring payment',
    description: 'Plan regular commitments and keep upcoming payments visible.',
  },
  budgets: {
    title: 'Budgets',
    singular: 'budget',
    description: 'Set category targets and spot overspending before month end.',
  },
};

export type EntityView = TransactionView | CategoryView | PaymentMethodView | RecurringPaymentView | BudgetView;

export function entityName(kind: EntityKind, item: EntityView) {
  if (kind === 'transactions' || kind === 'recurring') return (item as TransactionView | RecurringPaymentView).receiver;
  return (item as CategoryView | PaymentMethodView | BudgetView).name;
}
