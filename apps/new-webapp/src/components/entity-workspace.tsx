'use client';

import {ChevronLeft, ChevronRight, Merge, Pencil, Play, Plus, ReceiptText, Search, Trash2, X} from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {BudgetKpis, RecurringKpis, TransactionKpis} from '@/components/finance-kpis';
import {
  BulkActionToolbar,
  ExportMenu,
  MultiSelectFilter,
  PageSizeControl,
  RowActionMenu,
  type RowAction,
} from '@/components/table-controls';
import {TransactionAttachments} from '@/components/transaction-attachments';
import {TransactionListDialog, type TransactionScope} from '@/components/transaction-list-dialog';
import {Badge, Button, DialogShell, IconButton, SelectField, TextField} from '@/components/ui/primitives';
import {type MessageFormatter, useI18n} from '@/lib/i18n';
import {useFinance} from '@/lib/finance-provider';
import {parseMultiValue, parsePageSize, updateTableSearchParams} from '@/lib/table-state';
import type {
  BudgetView,
  CategoryView,
  EntityInput,
  EntityKind,
  PaymentMethodView,
  RecurringPaymentView,
  TransactionView,
} from '@/types/finance';
import {
  createCsv,
  createJson,
  downloadExport,
  exportFileName,
  type ExportColumn,
  type ExportFormat,
} from '@/utils/table-export';
import {recurringStatus} from '@/utils/recurring-status';

const META: Record<EntityKind, {titleKey: string; singularKey: string; descriptionKey: string}> = {
  transactions: {
    titleKey: 'entity.transactions.title',
    singularKey: 'entity.transactions.singular',
    descriptionKey: 'entity.transactions.description',
  },
  categories: {
    titleKey: 'entity.categories.title',
    singularKey: 'entity.categories.singular',
    descriptionKey: 'entity.categories.description',
  },
  'payment-methods': {
    titleKey: 'entity.paymentMethods.title',
    singularKey: 'entity.paymentMethods.singular',
    descriptionKey: 'entity.paymentMethods.description',
  },
  recurring: {
    titleKey: 'entity.recurring.title',
    singularKey: 'entity.recurring.singular',
    descriptionKey: 'entity.recurring.description',
  },
  budgets: {
    titleKey: 'entity.budgets.title',
    singularKey: 'entity.budgets.singular',
    descriptionKey: 'entity.budgets.description',
  },
};

type EntityView = TransactionView | CategoryView | PaymentMethodView | RecurringPaymentView | BudgetView;

function searchableText(item: EntityView) {
  return Object.values(item)
    .filter(value => typeof value === 'string')
    .join(' ')
    .toLocaleLowerCase();
}

function entityName(kind: EntityKind, item: EntityView) {
  if (kind === 'transactions' || kind === 'recurring') return (item as TransactionView | RecurringPaymentView).receiver;
  return (item as CategoryView | PaymentMethodView | BudgetView).name;
}

function editorDefaults(kind: EntityKind, item?: EntityView) {
  if (!item) return {};
  if (kind === 'transactions') {
    const transaction = item as TransactionView;
    return {
      amount: String(Math.abs(transaction.transferAmount)),
      type: transaction.transferAmount < 0 ? 'expense' : 'income',
      processedAt: transaction.processedAt.toISOString().slice(0, 10),
      receiver: transaction.receiver,
      information: transaction.information ?? '',
      categoryId: transaction.categoryId,
      paymentMethodId: transaction.paymentMethodId,
    };
  }
  if (kind === 'categories') {
    const category = item as CategoryView;
    return {name: category.name, description: category.description ?? ''};
  }
  if (kind === 'payment-methods') {
    const method = item as PaymentMethodView;
    return {
      name: method.name,
      provider: method.provider,
      address: method.address,
      description: method.description ?? '',
    };
  }
  if (kind === 'recurring') {
    const recurring = item as RecurringPaymentView;
    return {
      amount: String(Math.abs(recurring.transferAmount)),
      type: recurring.transferAmount < 0 ? 'expense' : 'income',
      executeAt: String(recurring.executeAt),
      interval: recurring.interval,
      receiver: recurring.receiver,
      information: recurring.information ?? '',
      categoryId: recurring.categoryId,
      paymentMethodId: recurring.paymentMethodId,
      paused: recurring.paused ? 'true' : 'false',
      expiresAt: recurring.expiresAt?.toISOString().slice(0, 10) ?? '',
    };
  }
  const budget = item as BudgetView;
  return {
    name: budget.name,
    description: budget.description ?? '',
    type: budget.type,
    budget: String(budget.budget),
    categories: budget.categoryIds,
  };
}

function parseEditorForm(
  kind: EntityKind,
  form: HTMLFormElement,
  t: MessageFormatter,
): {input?: EntityInput; error?: string} {
  const formData = new FormData(form);
  const stringValue = (name: string) => String(formData.get(name) ?? '').trim();
  if (kind === 'categories') {
    const name = stringValue('name');
    if (!name) return {error: t('entity.validation.categoryName')};
    return {input: {name, description: stringValue('description') || undefined}};
  }
  if (kind === 'payment-methods') {
    const name = stringValue('name');
    const provider = stringValue('provider');
    const address = stringValue('address');
    if (!name || !provider || !address) return {error: t('entity.validation.paymentMethod')};
    return {input: {name, provider, address, description: stringValue('description') || undefined}};
  }
  if (kind === 'transactions') {
    const amount = Number(stringValue('amount'));
    const date = new Date(`${stringValue('processedAt')}T12:00:00`);
    if (!Number.isFinite(amount) || amount <= 0) return {error: t('entity.validation.amount')};
    if (Number.isNaN(date.getTime())) return {error: t('entity.validation.transactionDate')};
    if (!stringValue('receiver') || !stringValue('categoryId') || !stringValue('paymentMethodId'))
      return {error: t('entity.validation.transactionRelations')};
    return {
      input: {
        processedAt: date,
        receiver: stringValue('receiver'),
        transferAmount: stringValue('type') === 'expense' ? -amount : amount,
        information: stringValue('information') || undefined,
        categoryId: stringValue('categoryId'),
        paymentMethodId: stringValue('paymentMethodId'),
      },
    };
  }
  if (kind === 'recurring') {
    const amount = Number(stringValue('amount'));
    const executeAt = Number(stringValue('executeAt'));
    const expiresAtValue = stringValue('expiresAt');
    const expiresAt = expiresAtValue ? new Date(`${expiresAtValue}T23:59:59`) : null;
    if (!Number.isFinite(amount) || amount <= 0) return {error: t('entity.validation.amount')};
    if (!Number.isInteger(executeAt) || executeAt < 1 || executeAt > 31)
      return {error: t('entity.validation.executionDay')};
    if (expiresAt && Number.isNaN(expiresAt.getTime())) return {error: t('entity.validation.endDate')};
    if (!stringValue('receiver') || !stringValue('categoryId') || !stringValue('paymentMethodId'))
      return {error: t('entity.validation.transactionRelations')};
    return {
      input: {
        executeAt,
        interval:
          stringValue('interval') === 'yearly'
            ? 'yearly'
            : stringValue('interval') === 'quarterly'
              ? 'quarterly'
              : 'monthly',
        paused: stringValue('paused') === 'true',
        expiresAt,
        receiver: stringValue('receiver'),
        transferAmount: stringValue('type') === 'expense' ? -amount : amount,
        information: stringValue('information') || undefined,
        categoryId: stringValue('categoryId'),
        paymentMethodId: stringValue('paymentMethodId'),
      },
    };
  }
  const budget = Number(stringValue('budget'));
  const name = stringValue('name');
  if (!name || !Number.isFinite(budget) || budget < 0) return {error: t('entity.validation.budget')};
  return {
    input: {
      type: stringValue('type') === 'i' ? 'i' : 'e',
      name,
      description: stringValue('description') || undefined,
      budget,
      categories: formData.getAll('categories').map(String),
    },
  };
}

export function EntityEditor({
  kind,
  item,
  open,
  onOpenChange,
}: {
  kind: EntityKind;
  item?: EntityView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {t} = useI18n();
  const {data, createEntity, updateEntity, mutationPending} = useFinance();
  const [formError, setFormError] = useState<string | null>(null);
  const defaults = editorDefaults(kind, item) as Record<string, string | string[] | undefined>;
  const meta = META[kind];
  const field = (name: string) => {
    const value = defaults[name];
    return typeof value === 'string' ? value : '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const parsed = parseEditorForm(kind, event.currentTarget, t);
    if (!parsed.input) {
      setFormError(parsed.error ?? t('entity.validation.fields'));
      return;
    }
    const saved = item ? await updateEntity(kind, item.id, parsed.input) : await createEntity(kind, parsed.input);
    if (saved) onOpenChange(false);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={`${item ? t('common.edit') : t('entity.new', {entity: ''}).trim()} ${t(meta.singularKey)}`}
      description={t('entity.requiredDescription')}
    >
      <form className="entity-form" onSubmit={event => void handleSubmit(event)}>
        {(kind === 'transactions' || kind === 'recurring') && (
          <>
            <div className="form-grid two">
              <SelectField label={t('entity.type')} name="type" defaultValue={field('type') || 'expense'} required>
                <option value="expense">{t('entity.expenses')}</option>
                <option value="income">{t('entity.income')}</option>
              </SelectField>
              <TextField
                label={t('common.amount')}
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={field('amount')}
                required
                autoFocus
              />
            </div>
            <TextField label={t('entity.receiver')} name="receiver" defaultValue={field('receiver')} required />
            {kind === 'transactions' ? (
              <TextField
                label={t('common.date')}
                name="processedAt"
                type="date"
                defaultValue={field('processedAt') || new Date().toISOString().slice(0, 10)}
                required
              />
            ) : (
              <>
                <div className="form-grid two">
                  <TextField
                    label={t('entity.dayOfMonth')}
                    name="executeAt"
                    type="number"
                    min="1"
                    max="31"
                    defaultValue={field('executeAt') || '1'}
                    required
                  />
                  <SelectField label={t('common.status')} name="paused" defaultValue={field('paused') || 'false'}>
                    <option value="false">{t('common.active')}</option>
                    <option value="true">{t('entity.pauseStatus')}</option>
                  </SelectField>
                </div>
                <SelectField label={t('entity.interval')} name="interval" defaultValue={field('interval') || 'monthly'}>
                  <option value="monthly">{t('entity.monthly')}</option>
                  <option value="quarterly">{t('entity.quarterly')}</option>
                  <option value="yearly">{t('entity.yearly')}</option>
                </SelectField>
                <TextField
                  label={t('entity.endsOn')}
                  name="expiresAt"
                  type="date"
                  defaultValue={field('expiresAt')}
                  hint={t('entity.endsOnHint')}
                />
              </>
            )}
            <div className="form-grid two">
              <SelectField label={t('common.category')} name="categoryId" defaultValue={field('categoryId')} required>
                <option value="">{t('entity.chooseCategory')}</option>
                {data.categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label={t('common.paymentMethod')}
                name="paymentMethodId"
                defaultValue={field('paymentMethodId')}
                required
              >
                <option value="">{t('entity.choosePaymentMethod')}</option>
                {data.paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField
              label={t('entity.information')}
              name="information"
              defaultValue={field('information')}
              placeholder={t('entity.optionalContext')}
            />
          </>
        )}
        {kind === 'categories' && (
          <>
            <TextField label={t('common.name')} name="name" defaultValue={field('name')} required autoFocus />
            <TextField label={t('common.description')} name="description" defaultValue={field('description')} />
          </>
        )}
        {kind === 'payment-methods' && (
          <>
            <TextField label={t('common.name')} name="name" defaultValue={field('name')} required autoFocus />
            <div className="form-grid two">
              <TextField label={t('entity.provider')} name="provider" defaultValue={field('provider')} required />
              <TextField label={t('entity.accountReference')} name="address" defaultValue={field('address')} required />
            </div>
            <TextField label={t('common.description')} name="description" defaultValue={field('description')} />
          </>
        )}
        {kind === 'budgets' && (
          <>
            <TextField label={t('entity.budgetName')} name="name" defaultValue={field('name')} required autoFocus />
            <div className="form-grid two">
              <SelectField label={t('entity.budgetType')} name="type" defaultValue={field('type') || 'e'}>
                <option value="i">{t('entity.includeCategories')}</option>
                <option value="e">{t('entity.excludeCategories')}</option>
              </SelectField>
              <TextField
                label={t('entity.targetAmount')}
                name="budget"
                type="number"
                min="0"
                step="0.01"
                defaultValue={field('budget')}
                required
              />
            </div>
            <SelectField
              label={t('entity.categories.title')}
              name="categories"
              multiple
              defaultValue={(defaults.categories as string[] | undefined) ?? []}
              hint={t('entity.categoriesHint')}
            >
              {data.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            <TextField label={t('common.description')} name="description" defaultValue={field('description')} />
          </>
        )}
        {kind === 'transactions' &&
          (item ? (
            <TransactionAttachments transactionId={item.id} />
          ) : (
            <p className="field-hint">{t('attachment.saveFirst')}</p>
          ))}
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        <div className="form-actions">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={mutationPending}>
            {mutationPending ? t('entity.saving') : t('entity.save')}
          </Button>
        </div>
      </form>
    </DialogShell>
  );
}

function exportColumns(kind: EntityKind): ExportColumn<EntityView>[] {
  if (kind === 'transactions')
    return [
      {key: 'id', header: 'id', value: row => row.id},
      {key: 'processedAt', header: 'processedAt', value: row => (row as TransactionView).processedAt.toISOString()},
      {key: 'amount', header: 'amount', value: row => (row as TransactionView).transferAmount},
      {key: 'receiver', header: 'receiver', value: row => (row as TransactionView).receiver},
      {key: 'categoryId', header: 'categoryId', value: row => (row as TransactionView).categoryId},
      {key: 'category', header: 'category', value: row => (row as TransactionView).categoryName},
      {key: 'paymentMethodId', header: 'paymentMethodId', value: row => (row as TransactionView).paymentMethodId},
      {key: 'paymentMethod', header: 'paymentMethod', value: row => (row as TransactionView).paymentMethodName},
      {key: 'note', header: 'note', value: row => (row as TransactionView).information},
      {key: 'attachmentCount', header: 'attachmentCount', value: row => (row as TransactionView).attachmentCount},
    ];
  if (kind === 'categories')
    return [
      {key: 'id', header: 'id', value: row => row.id},
      {key: 'name', header: 'name', value: row => (row as CategoryView).name},
      {key: 'description', header: 'description', value: row => (row as CategoryView).description},
    ];
  if (kind === 'payment-methods')
    return [
      {key: 'id', header: 'id', value: row => row.id},
      {key: 'name', header: 'name', value: row => (row as PaymentMethodView).name},
      {key: 'provider', header: 'provider', value: row => (row as PaymentMethodView).provider},
      {key: 'description', header: 'description', value: row => (row as PaymentMethodView).description},
    ];
  if (kind === 'recurring')
    return [
      {key: 'id', header: 'id', value: row => row.id},
      {key: 'receiver', header: 'receiver', value: row => (row as RecurringPaymentView).receiver},
      {key: 'amount', header: 'amount', value: row => (row as RecurringPaymentView).transferAmount},
      {key: 'executeDay', header: 'executeDay', value: row => (row as RecurringPaymentView).executeAt},
      {key: 'interval', header: 'interval', value: row => (row as RecurringPaymentView).interval},
      {
        key: 'nextExecutionAt',
        header: 'nextExecutionAt',
        value: row => (row as RecurringPaymentView).nextExecutionAt.toISOString(),
      },
      {key: 'status', header: 'status', value: row => recurringStatus(row as RecurringPaymentView)},
      {key: 'categoryId', header: 'categoryId', value: row => (row as RecurringPaymentView).categoryId},
      {key: 'paymentMethodId', header: 'paymentMethodId', value: row => (row as RecurringPaymentView).paymentMethodId},
    ];
  return [
    {key: 'id', header: 'id', value: row => row.id},
    {key: 'name', header: 'name', value: row => (row as BudgetView).name},
    {key: 'type', header: 'type', value: row => (row as BudgetView).type},
    {key: 'allocatedAmount', header: 'allocatedAmount', value: row => (row as BudgetView).budget},
    {key: 'spentAmount', header: 'spentAmount', value: row => Math.abs((row as BudgetView).balance)},
    {key: 'categoryIds', header: 'categoryIds', value: row => (row as BudgetView).categoryIds.join('|')},
  ];
}

function EntityRow({
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
  const {t, formatCurrency, formatDate} = useI18n();
  const {deleteEntity, executeRecurring, mutationPending} = useFinance();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const name = entityName(kind, item);
  let cells: React.ReactNode;
  if (kind === 'transactions') {
    const transaction = item as TransactionView;
    cells = (
      <>
        <span className="table-primary">
          <strong>{transaction.receiver}</strong>
          <small>{transaction.information || t('common.noNote')}</small>
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
          <small>{category.description || t('entity.noDescription')}</small>
        </span>
        <span>{t('common.category')}</span>
        <span className="muted">{t('entity.available')}</span>
      </>
    );
  } else if (kind === 'payment-methods') {
    const method = item as PaymentMethodView;
    cells = (
      <>
        <span className="table-primary">
          <strong>{method.name}</strong>
          <small>{method.description || t('entity.noDescription')}</small>
        </span>
        <span>{method.provider}</span>
        <span>{method.address}</span>
        <span>
          <Badge tone="good">{t('common.active')}</Badge>
        </span>
      </>
    );
  } else if (kind === 'recurring') {
    const recurring = item as RecurringPaymentView;
    const recurringState = recurringStatus(recurring);
    cells = (
      <>
        <span className="table-primary">
          <strong>{recurring.receiver}</strong>
          <small>{recurring.categoryName}</small>
        </span>
        <span className="table-primary">
          <strong>{formatDate(recurring.nextExecutionAt)}</strong>
          <small>
            {t(`entity.${recurring.interval}`)} · {t('entity.dayNumber', {day: recurring.executeAt})}
          </small>
        </span>
        <span>{recurring.paymentMethodName}</span>
        <span>
          <Badge tone={recurringState === 'expired' ? 'danger' : recurringState === 'inactive' ? 'warn' : 'good'}>
            {t(`common.${recurringState}`)}
          </Badge>
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
          <small>{budget.categoryNames.join(', ') || t('entity.noneAssigned')}</small>
        </span>
        <span>{t('entity.spent', {amount: formatCurrency(Math.abs(budget.balance))})}</span>
        <span>{t('entity.left', {amount: formatCurrency(Math.max(0, budget.budget - Math.abs(budget.balance)))})}</span>
        <span>
          <Badge tone={used >= 1 ? 'danger' : used >= 0.8 ? 'warn' : 'good'}>
            {t('entity.used', {percent: Math.round(used * 100)})}
          </Badge>
        </span>
        <span className="money">{formatCurrency(budget.budget)}</span>
      </>
    );
  }
  const now = new Date();
  const budget = kind === 'budgets' ? (item as BudgetView) : null;
  const budgetScope: TransactionScope = {
    ...(budget?.type === 'e'
      ? {excludeCategoryIds: budget.categoryIds}
      : {categoryIds: budget?.categoryIds ?? [item.id]}),
    ...(kind === 'budgets'
      ? {
          type: 'expense' as const,
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        }
      : {}),
  };
  const drilldownContext =
    kind === 'budgets'
      ? `${name} · ${formatDate(now, {month: 'long', year: 'numeric'})}`
      : t('entity.categoryContext', {name});
  const actions: RowAction[] = [
    ...(kind === 'categories' || kind === 'budgets'
      ? [
          {
            id: 'transactions',
            label: t('entity.viewTransactions', {name}),
            icon: <ReceiptText size={16} aria-hidden="true" />,
            onSelect: () => setDrilldownOpen(true),
          },
        ]
      : []),
    {
      id: 'edit',
      label: t('entity.editNamed', {name}),
      icon: <Pencil size={16} aria-hidden="true" />,
      onSelect: onEdit,
    },
    ...(kind === 'recurring'
      ? [
          {
            id: 'execute',
            label: t('entity.executeNamed', {name}),
            icon: <Play size={16} aria-hidden="true" />,
            disabled: mutationPending,
            onSelect: () => void executeRecurring(item.id),
          },
        ]
      : []),
    {
      id: 'delete',
      label: t('entity.deleteNamed', {name}),
      icon: <Trash2 size={16} aria-hidden="true" />,
      danger: true,
      onSelect: () => setDeleteOpen(true),
    },
  ];
  return (
    <>
      <div className={`data-row data-row-${kind}`} role="row">
        <span className="select-cell">
          <input type="checkbox" checked={selected} onChange={onSelect} aria-label={t('entity.selectNamed', {name})} />
        </span>
        {cells}
        <span className="row-actions">
          <RowActionMenu label={t('entity.actionsNamed', {name})} actions={actions} />
        </span>
      </div>
      <DialogShell
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('entity.deleteTitle', {name})}
        description={t('entity.deleteDescription', {entity: t(META[kind].singularKey)})}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={mutationPending}
              onClick={async () => {
                if (await deleteEntity(kind, item.id)) setDeleteOpen(false);
              }}
            >
              {mutationPending ? t('common.working') : t('common.delete')}
            </Button>
          </>
        }
      >
        <div className="danger-note">{t('common.actionCannotBeUndone')}</div>
      </DialogShell>
      {(kind === 'categories' || kind === 'budgets') && (
        <TransactionListDialog
          open={drilldownOpen}
          onOpenChange={setDrilldownOpen}
          title={t('entity.transactionsFor', {name})}
          context={drilldownContext}
          scope={budgetScope}
        />
      )}
    </>
  );
}

export function EntityWorkspace({kind}: {kind: EntityKind}) {
  const {t, formatDate} = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {data, status, error, reload, mergeEntities, deleteEntities, setTablePageSize, mutationPending} = useFinance();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EntityView | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const meta = {
    title: t(META[kind].titleKey),
    singular: t(META[kind].singularKey),
    description: t(META[kind].descriptionKey),
  };
  const query = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? (kind === 'transactions' ? 'date-desc' : 'name-asc');
  const typeFilter = searchParams.get('type') ?? '';
  const categoryFilters = parseMultiValue(new URLSearchParams(searchParams.toString()), 'category');
  const methodFilters = parseMultiValue(new URLSearchParams(searchParams.toString()), 'method');
  const statusFilter = searchParams.get('status') ?? '';
  const fromFilter = searchParams.get('from') ?? '';
  const toFilter = searchParams.get('to') ?? '';
  const pageSize = parsePageSize(searchParams.get('pageSize'));
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  useEffect(() => {
    setTablePageSize(kind, pageSize);
  }, [kind, pageSize, setTablePageSize]);

  const source: EntityView[] = kind === 'payment-methods' ? data.paymentMethods : data[kind];
  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase();
    const items = source.filter(item => {
      if (!searchableText(item).includes(normalized)) return false;
      if (kind === 'transactions') {
        const transaction = item as TransactionView;
        if (typeFilter === 'income' && transaction.transferAmount <= 0) return false;
        if (typeFilter === 'expense' && transaction.transferAmount >= 0) return false;
        if (categoryFilters.length > 0 && !categoryFilters.includes(transaction.categoryId)) return false;
        if (methodFilters.length > 0 && !methodFilters.includes(transaction.paymentMethodId)) return false;
        if (fromFilter && transaction.processedAt < new Date(`${fromFilter}T00:00:00`)) return false;
        if (toFilter && transaction.processedAt > new Date(`${toFilter}T23:59:59`)) return false;
      }
      if (kind === 'recurring') {
        const recurring = item as RecurringPaymentView;
        if (categoryFilters.length > 0 && !categoryFilters.includes(recurring.categoryId)) return false;
        if (methodFilters.length > 0 && !methodFilters.includes(recurring.paymentMethodId)) return false;
        if (statusFilter && recurringStatus(recurring) !== statusFilter) return false;
      }
      return true;
    });
    return items.toSorted((a, b) => {
      if (sort === 'date-desc' && kind === 'transactions')
        return (b as TransactionView).processedAt.getTime() - (a as TransactionView).processedAt.getTime();
      if (sort === 'amount-desc' && (kind === 'transactions' || kind === 'recurring'))
        return Math.abs((b as TransactionView).transferAmount) - Math.abs((a as TransactionView).transferAmount);
      return entityName(kind, a).localeCompare(entityName(kind, b)) * (sort === 'name-desc' ? -1 : 1);
    });
  }, [
    categoryFilters.join(','),
    fromFilter,
    kind,
    methodFilters.join(','),
    query,
    sort,
    source,
    statusFilter,
    toFilter,
    typeFilter,
  ]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const updateQuery = (changes: Record<string, string | readonly string[] | null>) => {
    const next = updateTableSearchParams(new URLSearchParams(searchParams.toString()), changes);
    router.replace(next.size ? `?${next.toString()}` : '?', {scroll: false});
  };
  const openEditor = (item?: EntityView) => {
    setEditing(item);
    setEditorOpen(true);
  };
  const mergeable = kind === 'categories' || kind === 'payment-methods';
  const selectedItems = filtered.filter(item => selected.includes(item.id));
  const openMerge = () => {
    const target = selectedItems[0];
    if (!target || !mergeable) return;
    setMergeTarget(target.id);
    setMergeOpen(true);
  };
  const confirmMerge = async () => {
    if (!mergeable || !mergeTarget) return;
    const sourceIds = selected.filter(id => id !== mergeTarget);
    if (sourceIds.length === 0) return;
    const merged = await mergeEntities(kind, sourceIds, mergeTarget);
    if (merged) {
      setSelected([]);
      setMergeOpen(false);
    }
  };
  const runExport = (format: ExportFormat, rows: readonly EntityView[] = filtered) => {
    const columns = exportColumns(kind);
    const content = format === 'csv' ? createCsv(rows, columns) : createJson(kind, rows, columns);
    downloadExport(content, exportFileName(kind, format), format);
  };
  const bulkDelete = async () => {
    const result = await deleteEntities(
      kind,
      selectedItems.map(item => item.id),
    );
    setSelected(result.failed.map(item => item.id));
  };

  useEffect(() => {
    const rawPageSize = searchParams.get('pageSize');
    if (rawPageSize && rawPageSize !== String(pageSize)) updateQuery({pageSize: String(pageSize), page: null});
  }, [pageSize, searchParams]);
  useEffect(() => {
    const intent = searchParams.get('intent');
    if (intent === 'create') openEditor();
    if (intent === 'edit') {
      const target = source.find(item => item.id === searchParams.get('id'));
      if (target) openEditor(target);
    }
  }, [searchParams, source]);

  const closeEditor = (open: boolean) => {
    setEditorOpen(open);
    if (!open && searchParams.has('intent')) updateQuery({intent: null, id: null});
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('entity.financeData')}
        title={meta.title}
        description={meta.description}
        action={
          <Button onClick={() => openEditor()}>
            <Plus size={17} /> {t('entity.new', {entity: meta.singular})}
          </Button>
        }
      />
      {kind === 'transactions' && (
        <TransactionKpis
          transactions={filtered as TransactionView[]}
          periodLabel={
            fromFilter || toFilter
              ? `${fromFilter ? formatDate(fromFilter) : t('entity.anyDate')} – ${toFilter ? formatDate(toFilter) : t('entity.anyDate')}`
              : t('entity.allDates')
          }
          loading={status === 'loading'}
          error={status === 'error' ? error : null}
          onRetry={() => void reload(true)}
        />
      )}
      {kind === 'recurring' && (
        <RecurringKpis
          payments={filtered as RecurringPaymentView[]}
          loading={status === 'loading'}
          error={status === 'error' ? error : null}
          onRetry={() => void reload(true)}
        />
      )}
      {kind === 'budgets' && (
        <BudgetKpis
          budgets={filtered as BudgetView[]}
          categoryIds={data.categories.map(category => category.id)}
          periodLabel={formatDate(new Date(), {month: 'long', year: 'numeric'})}
          loading={status === 'loading'}
          error={status === 'error' ? error : null}
          onRetry={() => void reload(true)}
        />
      )}
      <section className="workspace-panel" aria-label={t('entity.workspace', {entity: meta.title})}>
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={17} />
            <input
              aria-label={t('entity.search', {entity: meta.title.toLocaleLowerCase()})}
              value={query}
              onChange={event => updateQuery({q: event.target.value || null, page: null})}
              placeholder={`${t('entity.search', {entity: meta.title.toLocaleLowerCase()})}…`}
            />
            {query && (
              <button aria-label={t('entity.clearSearch')} onClick={() => updateQuery({q: null, page: null})}>
                <X size={15} />
              </button>
            )}
          </label>
          <div className="toolbar-actions">
            <ExportMenu
              label={t('common.export')}
              csvLabel={t('common.exportCsv')}
              jsonLabel={t('common.exportJson')}
              disabled={filtered.length === 0}
              onExport={runExport}
            />
            <SelectField
              label={t('entity.sort')}
              className="compact-field"
              aria-label={t('entity.sortResults')}
              value={sort}
              onChange={event => updateQuery({sort: event.target.value, page: null})}
            >
              {kind === 'transactions' && <option value="date-desc">{t('entity.newestFirst')}</option>}
              {(kind === 'transactions' || kind === 'recurring') && (
                <option value="amount-desc">{t('entity.highestAmount')}</option>
              )}
              <option value="name-asc">{t('entity.nameAsc')}</option>
              <option value="name-desc">{t('entity.nameDesc')}</option>
            </SelectField>
            <PageSizeControl
              label={t('common.rowsPerPage')}
              value={pageSize}
              onChange={value => updateQuery({pageSize: String(value), page: null})}
            />
          </div>
        </div>
        {selected.length > 0 && (
          <div className="selection-toolbar">
            <BulkActionToolbar
              count={selectedItems.length}
              entityLabel={meta.title.toLocaleLowerCase()}
              selectionLabel={t('common.selected')}
              deleteLabel={t('common.delete')}
              exportLabel={t('entity.exportSelected')}
              exportCsvLabel={t('entity.exportSelectedCsv')}
              exportJsonLabel={t('entity.exportSelectedJson')}
              confirmTitle={t('entity.bulkDeleteTitle', {
                count: selectedItems.length,
                entity: selectedItems.length === 1 ? meta.singular : meta.title.toLocaleLowerCase(),
              })}
              confirmDescription={t('entity.onlySelectedDeleted')}
              busy={mutationPending}
              canDelete
              onDelete={bulkDelete}
              onExport={format => runExport(format, selectedItems)}
            />
            {mergeable && selectedItems.length >= 2 && (
              <Button variant="secondary" size="sm" onClick={openMerge}>
                <Merge size={15} /> {t('entity.merge')}
              </Button>
            )}
          </div>
        )}
        {(kind === 'transactions' || kind === 'recurring') && (
          <div className="filter-bar" aria-label={t('entity.filters', {entity: meta.title})}>
            {kind === 'transactions' && (
              <SelectField
                label={t('entity.type')}
                className="compact-field"
                value={typeFilter}
                onChange={event => updateQuery({type: event.target.value || null, page: null})}
              >
                <option value="">{t('entity.allTypes')}</option>
                <option value="income">{t('entity.income')}</option>
                <option value="expense">{t('entity.expenses')}</option>
              </SelectField>
            )}
            <MultiSelectFilter
              label={t('common.category')}
              clearLabel={t('entity.removeCategory')}
              values={categoryFilters}
              options={data.categories.map(category => ({value: category.id, label: category.name}))}
              onChange={values => updateQuery({category: values, page: null})}
            />
            <MultiSelectFilter
              label={t('common.paymentMethod')}
              clearLabel={t('entity.removePaymentMethod')}
              values={methodFilters}
              options={data.paymentMethods.map(method => ({value: method.id, label: method.name}))}
              onChange={values => updateQuery({method: values, page: null})}
            />
            {kind === 'recurring' && (
              <SelectField
                label={t('common.status')}
                className="compact-field"
                value={statusFilter}
                onChange={event => updateQuery({status: event.target.value || null, page: null})}
              >
                <option value="">{t('entity.anyStatus')}</option>
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
                <option value="expired">{t('common.expired')}</option>
              </SelectField>
            )}
            {kind === 'transactions' && (
              <>
                <TextField
                  label={t('entity.from')}
                  className="compact-field"
                  type="date"
                  value={fromFilter}
                  onChange={event => updateQuery({from: event.target.value || null, page: null})}
                />
                <TextField
                  label={t('entity.to')}
                  className="compact-field"
                  type="date"
                  value={toFilter}
                  onChange={event => updateQuery({to: event.target.value || null, page: null})}
                />
              </>
            )}
            {(typeFilter ||
              categoryFilters.length > 0 ||
              methodFilters.length > 0 ||
              statusFilter ||
              fromFilter ||
              toFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateQuery({
                    type: null,
                    category: null,
                    method: null,
                    status: null,
                    from: null,
                    to: null,
                    page: null,
                  })
                }
              >
                {t('entity.clearFilters')}
              </Button>
            )}
          </div>
        )}
        {status === 'loading' && source.length === 0 ? (
          <SkeletonRows count={7} />
        ) : status === 'error' ? (
          <StatePanel state="error" description={error ?? undefined} onRetry={() => void reload(true)} />
        ) : visible.length === 0 ? (
          <StatePanel
            state="empty"
            title={query ? t('entity.noResults') : undefined}
            description={query ? t('entity.noResultsDescription') : undefined}
          />
        ) : (
          <div className="data-table" role="table" aria-label={meta.title}>
            <div className={`data-header data-row-${kind}`} role="row">
              <span className="select-cell">
                <input
                  type="checkbox"
                  aria-label={t('entity.selectVisible')}
                  checked={visible.length > 0 && visible.every(item => selected.includes(item.id))}
                  onChange={() =>
                    setSelected(
                      visible.every(item => selected.includes(item.id))
                        ? selected.filter(id => !visible.some(item => item.id === id))
                        : [...new Set([...selected, ...visible.map(item => item.id)])],
                    )
                  }
                />
              </span>
              <span>{kind === 'transactions' || kind === 'recurring' ? t('entity.payee') : t('common.name')}</span>
              <span>
                {kind === 'transactions'
                  ? t('common.category')
                  : kind === 'budgets'
                    ? t('kpi.budget.spent')
                    : t('entity.details')}
              </span>
              <span>
                {kind === 'transactions'
                  ? t('common.paymentMethod')
                  : kind === 'budgets'
                    ? t('kpi.budget.remaining')
                    : t('entity.reference')}
              </span>
              {kind !== 'categories' && <span>{t('entity.statusDate')}</span>}
              {(kind === 'transactions' || kind === 'recurring' || kind === 'budgets') && (
                <span className="align-right">{t('common.amount')}</span>
              )}
              <span aria-label={t('common.actions')} />
            </div>
            {visible.map(item => (
              <EntityRow
                key={item.id}
                kind={kind}
                item={item}
                selected={selected.includes(item.id)}
                onSelect={() =>
                  setSelected(current =>
                    current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id],
                  )
                }
                onEdit={() => openEditor(item)}
              />
            ))}
          </div>
        )}
        <div className="table-footer">
          <span>
            {filtered.length === 0
              ? t('entity.resultCount', {count: 0})
              : t('entity.resultRange', {
                  from: (currentPage - 1) * pageSize + 1,
                  to: Math.min(currentPage * pageSize, filtered.length),
                  count: filtered.length,
                })}
          </span>
          <div>
            <IconButton
              aria-label={t('common.previousPage')}
              disabled={currentPage <= 1}
              onClick={() => updateQuery({page: String(currentPage - 1)})}
            >
              <ChevronLeft size={17} />
            </IconButton>
            <span>{t('common.pageOf', {page: currentPage, count: pageCount})}</span>
            <IconButton
              aria-label={t('common.nextPage')}
              disabled={currentPage >= pageCount}
              onClick={() => updateQuery({page: String(currentPage + 1)})}
            >
              <ChevronRight size={17} />
            </IconButton>
          </div>
        </div>
      </section>
      <EntityEditor kind={kind} item={editing} open={editorOpen} onOpenChange={closeEditor} />
      <DialogShell
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        title={t('entity.mergeTitle', {entity: meta.title.toLocaleLowerCase()})}
        description={t('entity.mergeDescription')}
      >
        <div className="entity-form">
          <SelectField
            label={t('entity.keepRecord')}
            value={mergeTarget}
            onChange={event => setMergeTarget(event.target.value)}
          >
            {selectedItems.map(item => (
              <option key={item.id} value={item.id}>
                {entityName(kind, item)}
              </option>
            ))}
          </SelectField>
          <div className="merge-summary">
            <strong>{t('entity.mergeCount', {count: selectedItems.length - 1})}</strong>
            <p>{t('entity.mergeConnections')}</p>
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setMergeOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button disabled={mutationPending || !mergeTarget} onClick={() => void confirmMerge()}>
              {mutationPending ? t('entity.merging') : t('entity.mergeRecords')}
            </Button>
          </div>
        </div>
      </DialogShell>
    </div>
  );
}
