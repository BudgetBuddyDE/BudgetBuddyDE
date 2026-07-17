'use client';

import {Pencil, Play, Trash2} from 'lucide-react';
import {ENTITY_META, entityName, type EntityView} from '@/components/entity-workspace-shared';
import {Badge, ConfirmDialog, IconButton, Tooltip} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import type {
  BudgetView,
  CategoryView,
  EntityKind,
  PaymentMethodView,
  RecurringPaymentView,
  TransactionView,
} from '@/types/finance';
import {formatCurrency, formatDate} from '@/utils/format';

export function EntityRow({
  kind,
  item,
  selected,
  onSelect,
  onEdit,
}: {
  kind: EntityKind;
  item: EntityView;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const {deleteEntity, executeRecurring, mutationPending} = useFinance();
  const name = entityName(kind, item);
  let cells: React.ReactNode;
  if (kind === 'transactions') {
    const transaction = item as TransactionView;
    cells = (
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
  } else if (kind === 'categories') {
    const category = item as CategoryView;
    cells = (
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
  } else if (kind === 'payment-methods') {
    const method = item as PaymentMethodView;
    cells = (
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
  } else if (kind === 'recurring') {
    const recurring = item as RecurringPaymentView;
    cells = (
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
  } else {
    const budget = item as BudgetView;
    const used = budget.budget ? Math.abs(budget.balance) / budget.budget : 0;
    cells = (
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
  }
  return (
    <div className={`data-row data-row-${kind}`} role="row">
      <span className="select-cell">
        <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Select ${name}`} />
      </span>
      {cells}
      <span className="row-actions">
        {kind === 'recurring' && (
          <Tooltip label={`Execute ${name}`}>
            <IconButton
              aria-label={`Execute ${name}`}
              disabled={mutationPending}
              onClick={() => void executeRecurring(item.id)}
            >
              <Play size={16} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip label={`Edit ${name}`}>
          <IconButton aria-label={`Edit ${name}`} onClick={onEdit}>
            <Pencil size={16} />
          </IconButton>
        </Tooltip>
        <ConfirmDialog
          trigger={
            <Tooltip label={`Delete ${name}`}>
              <IconButton aria-label={`Delete ${name}`}>
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          }
          title={`Delete ${name}?`}
          description={`The ${ENTITY_META[kind].singular} and its direct associations will be removed.`}
          confirmLabel="Delete"
          busy={mutationPending}
          onConfirm={async () => {
            await deleteEntity(kind, item.id);
          }}
        />
      </span>
    </div>
  );
}
