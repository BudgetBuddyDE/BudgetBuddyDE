'use client';

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Merge,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {
  Badge,
  Button,
  ConfirmDialog,
  DialogShell,
  IconButton,
  SelectField,
  TextField,
  Tooltip,
} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import type {
  BudgetView,
  CategoryView,
  EntityInput,
  EntityKind,
  PaymentMethodView,
  RecurringPaymentView,
  TransactionView,
} from '@/types/finance';
import {downloadTextFile, serializeRecordsCsv} from '@/utils/export';
import {formatCurrency, formatDate} from '@/utils/format';

const PAGE_SIZE = 10;
const META: Record<EntityKind, {title: string; singular: string; description: string}> = {
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

function parseEditorForm(kind: EntityKind, form: HTMLFormElement): {input?: EntityInput; error?: string} {
  const formData = new FormData(form);
  const stringValue = (name: string) => String(formData.get(name) ?? '').trim();
  if (kind === 'categories') {
    const name = stringValue('name');
    if (!name) return {error: 'Enter a category name.'};
    return {input: {name, description: stringValue('description') || undefined}};
  }
  if (kind === 'payment-methods') {
    const name = stringValue('name');
    const provider = stringValue('provider');
    const address = stringValue('address');
    if (!name || !provider || !address) return {error: 'Name, provider, and account reference are required.'};
    return {input: {name, provider, address, description: stringValue('description') || undefined}};
  }
  if (kind === 'transactions') {
    const amount = Number(stringValue('amount'));
    const date = new Date(`${stringValue('processedAt')}T12:00:00`);
    if (!Number.isFinite(amount) || amount <= 0) return {error: 'Enter an amount greater than zero.'};
    if (Number.isNaN(date.getTime())) return {error: 'Choose a valid transaction date.'};
    if (!stringValue('receiver') || !stringValue('categoryId') || !stringValue('paymentMethodId'))
      return {error: 'Receiver, category, and payment method are required.'};
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
    if (!Number.isFinite(amount) || amount <= 0) return {error: 'Enter an amount greater than zero.'};
    if (!Number.isInteger(executeAt) || executeAt < 1 || executeAt > 31)
      return {error: 'Execution day must be between 1 and 31.'};
    if (!stringValue('receiver') || !stringValue('categoryId') || !stringValue('paymentMethodId'))
      return {error: 'Receiver, category, and payment method are required.'};
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
  if (!name || !Number.isFinite(budget) || budget < 0) return {error: 'Enter a name and a valid target amount.'};
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
    const parsed = parseEditorForm(kind, event.currentTarget);
    if (!parsed.input) {
      setFormError(parsed.error ?? 'Check the highlighted fields.');
      return;
    }
    const saved = item ? await updateEntity(kind, item.id, parsed.input) : await createEntity(kind, parsed.input);
    if (saved) onOpenChange(false);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={`${item ? 'Edit' : 'New'} ${meta.singular}`}
      description="Required fields are marked. Values are validated before saving."
    >
      <form className="entity-form" onSubmit={event => void handleSubmit(event)}>
        {(kind === 'transactions' || kind === 'recurring') && (
          <>
            <div className="form-grid two">
              <SelectField label="Type" name="type" defaultValue={field('type') || 'expense'} required>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </SelectField>
              <TextField
                label="Amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={field('amount')}
                required
                autoFocus
              />
            </div>
            <TextField label="Receiver / sender" name="receiver" defaultValue={field('receiver')} required />
            {kind === 'transactions' ? (
              <TextField
                label="Date"
                name="processedAt"
                type="date"
                defaultValue={field('processedAt') || new Date().toISOString().slice(0, 10)}
                required
              />
            ) : (
              <>
                <div className="form-grid two">
                  <TextField
                    label="Day of month"
                    name="executeAt"
                    type="number"
                    min="1"
                    max="31"
                    defaultValue={field('executeAt') || '1'}
                    required
                  />
                  <SelectField label="Status" name="paused" defaultValue={field('paused') || 'false'}>
                    <option value="false">Active</option>
                    <option value="true">Paused</option>
                  </SelectField>
                </div>
                <SelectField label="Interval" name="interval" defaultValue={field('interval') || 'monthly'}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </SelectField>
              </>
            )}
            <div className="form-grid two">
              <SelectField label="Category" name="categoryId" defaultValue={field('categoryId')} required>
                <option value="">Choose category</option>
                {data.categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Payment method"
                name="paymentMethodId"
                defaultValue={field('paymentMethodId')}
                required
              >
                <option value="">Choose method</option>
                {data.paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField
              label="Note"
              name="information"
              defaultValue={field('information')}
              placeholder="Optional context"
            />
          </>
        )}
        {kind === 'categories' && (
          <>
            <TextField label="Name" name="name" defaultValue={field('name')} required autoFocus />
            <TextField label="Description" name="description" defaultValue={field('description')} />
          </>
        )}
        {kind === 'payment-methods' && (
          <>
            <TextField label="Name" name="name" defaultValue={field('name')} required autoFocus />
            <div className="form-grid two">
              <TextField label="Provider" name="provider" defaultValue={field('provider')} required />
              <TextField label="Account reference" name="address" defaultValue={field('address')} required />
            </div>
            <TextField label="Description" name="description" defaultValue={field('description')} />
          </>
        )}
        {kind === 'budgets' && (
          <>
            <TextField label="Budget name" name="name" defaultValue={field('name')} required autoFocus />
            <div className="form-grid two">
              <SelectField label="Budget type" name="type" defaultValue={field('type') || 'e'}>
                <option value="e">Expense</option>
                <option value="i">Income</option>
              </SelectField>
              <TextField
                label="Target amount"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                defaultValue={field('budget')}
                required
              />
            </div>
            <SelectField
              label="Categories"
              name="categories"
              multiple
              defaultValue={(defaults.categories as string[] | undefined) ?? []}
              hint="Hold Ctrl or Command to select multiple categories."
            >
              {data.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            <TextField label="Description" name="description" defaultValue={field('description')} />
          </>
        )}
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        <div className="form-actions">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutationPending}>
            {mutationPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </DialogShell>
  );
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
          description={`The ${META[kind].singular} and its direct associations will be removed.`}
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

export function EntityWorkspace({kind}: {kind: EntityKind}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {data, status, error, reload, deleteEntity, mergeEntities, mutationPending} = useFinance();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EntityView | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const meta = META[kind];
  const query = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? (kind === 'transactions' ? 'date-desc' : 'name-asc');
  const typeFilter = searchParams.get('type') ?? '';
  const categoryFilter = searchParams.get('category') ?? '';
  const methodFilter = searchParams.get('method') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const fromFilter = searchParams.get('from') ?? '';
  const toFilter = searchParams.get('to') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const source: EntityView[] = kind === 'payment-methods' ? data.paymentMethods : data[kind];
  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase();
    const items = source.filter(item => {
      if (!searchableText(item).includes(normalized)) return false;
      if (kind === 'transactions') {
        const transaction = item as TransactionView;
        if (typeFilter === 'income' && transaction.transferAmount <= 0) return false;
        if (typeFilter === 'expense' && transaction.transferAmount >= 0) return false;
        if (categoryFilter && transaction.categoryId !== categoryFilter) return false;
        if (methodFilter && transaction.paymentMethodId !== methodFilter) return false;
        if (fromFilter && transaction.processedAt < new Date(`${fromFilter}T00:00:00`)) return false;
        if (toFilter && transaction.processedAt > new Date(`${toFilter}T23:59:59`)) return false;
      }
      if (kind === 'recurring') {
        const recurring = item as RecurringPaymentView;
        if (categoryFilter && recurring.categoryId !== categoryFilter) return false;
        if (methodFilter && recurring.paymentMethodId !== methodFilter) return false;
        if (statusFilter === 'active' && recurring.paused) return false;
        if (statusFilter === 'paused' && !recurring.paused) return false;
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
  }, [categoryFilter, fromFilter, kind, methodFilter, query, sort, source, statusFilter, toFilter, typeFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((Math.min(page, pageCount) - 1) * PAGE_SIZE, Math.min(page, pageCount) * PAGE_SIZE);

  const updateQuery = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`?${next.toString()}`, {scroll: false});
  };
  const openEditor = (item?: EntityView) => {
    setEditing(item);
    setEditorOpen(true);
  };
  const mergeable = kind === 'categories' || kind === 'payment-methods';
  const selectedItems = source.filter(item => selected.includes(item.id));
  const exportItems = selectedItems.length > 0 ? selectedItems : filtered;
  const deleteSelected = async () => {
    const deletedIds = new Set<string>();
    for (const item of selectedItems) {
      if (await deleteEntity(kind, item.id)) deletedIds.add(item.id);
    }
    setSelected(current => current.filter(id => !deletedIds.has(id)));
  };
  const exportCsv = () => {
    downloadTextFile(
      serializeRecordsCsv(exportItems),
      'text/csv;charset=utf-8',
      `budgetbuddy-${kind}${selectedItems.length > 0 ? '-selected' : ''}.csv`,
    );
  };
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
        eyebrow="Finance data"
        title={meta.title}
        description={meta.description}
        action={
          <Button onClick={() => openEditor()}>
            <Plus size={17} /> New {meta.singular}
          </Button>
        }
      />
      <section className="workspace-panel" aria-label={`${meta.title} workspace`}>
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={17} />
            <input
              aria-label={`Search ${meta.title.toLocaleLowerCase()}`}
              value={query}
              onChange={event => updateQuery({q: event.target.value || null, page: null})}
              placeholder={`Search ${meta.title.toLocaleLowerCase()}…`}
            />
            {query && (
              <button aria-label="Clear search" onClick={() => updateQuery({q: null, page: null})}>
                <X size={15} />
              </button>
            )}
          </label>
          <div className="toolbar-actions">
            {selected.length > 0 && <Badge tone="neutral">{selected.length} selected</Badge>}
            {mergeable && selected.length >= 2 && (
              <Button variant="secondary" size="sm" onClick={openMerge}>
                <Merge size={15} /> Merge
              </Button>
            )}
            {selected.length > 0 && (
              <ConfirmDialog
                trigger={
                  <Button variant="danger" size="sm">
                    <Trash2 size={15} /> Delete selected
                  </Button>
                }
                title={`Delete ${selected.length} selected ${selected.length === 1 ? meta.singular : meta.title.toLocaleLowerCase()}?`}
                description="Every selected record and its direct associations will be removed."
                confirmLabel="Delete selected"
                busy={mutationPending}
                onConfirm={deleteSelected}
              />
            )}
            <Button variant="secondary" size="sm" disabled={exportItems.length === 0} onClick={exportCsv}>
              <Download size={15} /> {selected.length > 0 ? 'Export selected CSV' : 'Export CSV'}
            </Button>
            <SelectField
              label="Sort"
              className="compact-field"
              aria-label="Sort results"
              value={sort}
              onChange={event => updateQuery({sort: event.target.value, page: null})}
            >
              {kind === 'transactions' && <option value="date-desc">Newest first</option>}
              {(kind === 'transactions' || kind === 'recurring') && <option value="amount-desc">Highest amount</option>}
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </SelectField>

          </div>
        </div>
        {(kind === 'transactions' || kind === 'recurring') && (
          <div className="filter-bar" aria-label={`${meta.title} filters`}>
            {kind === 'transactions' && (
              <SelectField
                label="Type"
                className="compact-field"
                value={typeFilter}
                onChange={event => updateQuery({type: event.target.value || null, page: null})}
              >
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </SelectField>
            )}
            <SelectField
              label="Category"
              className="compact-field"
              value={categoryFilter}
              onChange={event => updateQuery({category: event.target.value || null, page: null})}
            >
              <option value="">All categories</option>
              {data.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Payment method"
              className="compact-field"
              value={methodFilter}
              onChange={event => updateQuery({method: event.target.value || null, page: null})}
            >
              <option value="">All methods</option>
              {data.paymentMethods.map(method => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </SelectField>
            {kind === 'recurring' && (
              <SelectField
                label="Status"
                className="compact-field"
                value={statusFilter}
                onChange={event => updateQuery({status: event.target.value || null, page: null})}
              >
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </SelectField>
            )}
            {kind === 'transactions' && (
              <>
                <TextField
                  label="From"
                  className="compact-field"
                  type="date"
                  value={fromFilter}
                  onChange={event => updateQuery({from: event.target.value || null, page: null})}
                />
                <TextField
                  label="To"
                  className="compact-field"
                  type="date"
                  value={toFilter}
                  onChange={event => updateQuery({to: event.target.value || null, page: null})}
                />
              </>
            )}
            {(typeFilter || categoryFilter || methodFilter || statusFilter || fromFilter || toFilter) && (
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
                Clear filters
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
            title={query ? 'No matching results' : undefined}
            description={query ? 'Change or clear the search to see more results.' : undefined}
          />
        ) : (
          <div className="data-table" role="table" aria-label={meta.title}>
            <div className={`data-header data-row-${kind}`} role="row">
              <span className="select-cell">
                <input
                  type="checkbox"
                  aria-label="Select visible rows"
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
              <span>{kind === 'transactions' || kind === 'recurring' ? 'Payee' : 'Name'}</span>
              <span>{kind === 'transactions' ? 'Category' : kind === 'budgets' ? 'Spent' : 'Details'}</span>
              <span>{kind === 'transactions' ? 'Payment method' : kind === 'budgets' ? 'Remaining' : 'Reference'}</span>
              {kind !== 'categories' && <span>Status / date</span>}
              {(kind === 'transactions' || kind === 'recurring' || kind === 'budgets') && (
                <span className="align-right">Amount</span>
              )}
              <span aria-label="Actions" />
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
              ? '0 results'
              : `${(Math.min(page, pageCount) - 1) * PAGE_SIZE + 1}–${Math.min(Math.min(page, pageCount) * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </span>
          <div>
            <IconButton
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => updateQuery({page: String(page - 1)})}
            >
              <ChevronLeft size={17} />
            </IconButton>
            <span>
              Page {Math.min(page, pageCount)} of {pageCount}
            </span>
            <IconButton
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => updateQuery({page: String(page + 1)})}
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
        title={`Merge ${META[kind].title.toLocaleLowerCase()}`}
        description="Choose the record to keep. Existing assignments are moved to that record."
      >
        <div className="entity-form">
          <SelectField
            label="Keep this record"
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
            <strong>
              {selectedItems.length - 1} record{selectedItems.length === 2 ? '' : 's'} will be merged
            </strong>
            <p>Transactions and historical assignments remain connected to the retained record.</p>
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setMergeOpen(false)}>
              Cancel
            </Button>
            <Button disabled={mutationPending || !mergeTarget} onClick={() => void confirmMerge()}>
              {mutationPending ? 'Merging…' : 'Merge records'}
            </Button>
          </div>
        </div>
      </DialogShell>
    </div>
  );
}
