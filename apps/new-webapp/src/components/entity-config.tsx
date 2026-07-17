import {Badge} from '@/components/ui/primitives';
import type {
  BudgetView,
  CategoryView,
  EntityKind,
  FinanceData,
  PaymentMethodView,
  RecurringPaymentView,
  TransactionView,
} from '@/types/finance';
import {formatCurrency, formatDate} from '@/utils/format';

export type EntityView = TransactionView | CategoryView | PaymentMethodView | RecurringPaymentView | BudgetView;

interface EntityMeta {
  title: string;
  singular: string;
  description: string;
}

export interface EntityConfig {
  meta: EntityMeta;
  select: (data: FinanceData) => EntityView[];
  name: (item: EntityView) => string;
  headers: readonly string[];
  renderCells: (item: EntityView) => React.ReactNode;
  mergeable?: boolean;
}

export const ENTITY_CONFIG: Record<EntityKind, EntityConfig> = {
  transactions: {
    meta: {
      title: 'Transactions',
      singular: 'transaction',
      description: 'Review, filter, and maintain every movement of money.',
    },
    select: data => data.transactions,
    name: item => (item as TransactionView).receiver,
    headers: ['Payee', 'Category', 'Payment method', 'Status / date', 'Amount'],
    renderCells: item => {
      const transaction = item as TransactionView;
      return (
        <>
          <span className="table-primary">
            <strong>{transaction.receiver}</strong>
            <small>{transaction.information || 'No note'}</small>
          </span>
          <span>{transaction.categoryName}</span>
          <span>{transaction.paymentMethodName}</span>
          <span>{formatDate(transaction.processedAt)}</span>
          <span className={transaction.transferAmount < 0 ? 'money expense' : 'money income'}>
            {formatCurrency(transaction.transferAmount)}
          </span>
        </>
      );
    },
  },
  categories: {
    meta: {
      title: 'Categories',
      singular: 'category',
      description: 'Keep your financial taxonomy clear and consistent.',
    },
    select: data => data.categories,
    name: item => (item as CategoryView).name,
    headers: ['Name', 'Details', 'Reference'],
    mergeable: true,
    renderCells: item => {
      const category = item as CategoryView;
      return (
        <>
          <span className="table-primary">
            <strong>
              <i className="category-dot" />
              {category.name}
            </strong>
            <small>{category.description || 'No description'}</small>
          </span>
          <span>Category</span>
          <span className="muted">Available</span>
        </>
      );
    },
  },
  'payment-methods': {
    meta: {
      title: 'Payment methods',
      singular: 'payment method',
      description: 'Manage the accounts and cards used for your transactions.',
    },
    select: data => data.paymentMethods,
    name: item => (item as PaymentMethodView).name,
    headers: ['Name', 'Details', 'Reference', 'Status / date'],
    mergeable: true,
    renderCells: item => {
      const method = item as PaymentMethodView;
      return (
        <>
          <span className="table-primary">
            <strong>{method.name}</strong>
            <small>{method.description || 'No description'}</small>
          </span>
          <span>{method.provider}</span>
          <span>{method.address}</span>
          <span>
            <Badge tone="good">Active</Badge>
          </span>
        </>
      );
    },
  },
  recurring: {
    meta: {
      title: 'Recurring payments',
      singular: 'recurring payment',
      description: 'Plan regular commitments and keep upcoming payments visible.',
    },
    select: data => data.recurring,
    name: item => (item as RecurringPaymentView).receiver,
    headers: ['Payee', 'Details', 'Reference', 'Status / date', 'Amount'],
    renderCells: item => {
      const recurring = item as RecurringPaymentView;
      return (
        <>
          <span className="table-primary">
            <strong>{recurring.receiver}</strong>
            <small>{recurring.categoryName}</small>
          </span>
          <span className="table-primary">
            <strong>{formatDate(recurring.nextExecutionAt)}</strong>
            <small>
              {recurring.interval[0]?.toLocaleUpperCase()}
              {recurring.interval.slice(1)} · day {recurring.executeAt}
            </small>
          </span>
          <span>{recurring.paymentMethodName}</span>
          <span>
            <Badge tone={recurring.paused ? 'warn' : 'good'}>{recurring.paused ? 'Paused' : 'Active'}</Badge>
          </span>
          <span className={recurring.transferAmount < 0 ? 'money expense' : 'money income'}>
            {formatCurrency(recurring.transferAmount)}
          </span>
        </>
      );
    },
  },
  budgets: {
    meta: {
      title: 'Budgets',
      singular: 'budget',
      description: 'Set category targets and spot overspending before month end.',
    },
    select: data => data.budgets,
    name: item => (item as BudgetView).name,
    headers: ['Name', 'Spent', 'Remaining', 'Status / date', 'Amount'],
    renderCells: item => {
      const budget = item as BudgetView;
      const used = budget.budget ? Math.abs(budget.balance) / budget.budget : 0;
      return (
        <>
          <span className="table-primary">
            <strong>{budget.name}</strong>
            <small>{budget.categoryNames.join(', ') || 'No category assigned'}</small>
          </span>
          <span>{formatCurrency(Math.abs(budget.balance))} spent</span>
          <span>{formatCurrency(Math.max(0, budget.budget - Math.abs(budget.balance)))} left</span>
          <span>
            <Badge tone={used >= 1 ? 'danger' : used >= 0.8 ? 'warn' : 'good'}>{Math.round(used * 100)}% used</Badge>
          </span>
          <span className="money">{formatCurrency(budget.budget)}</span>
        </>
      );
    },
  },
};
