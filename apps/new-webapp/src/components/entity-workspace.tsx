'use client';

import {ChevronLeft, ChevronRight, Download, Merge, Plus, Search, Trash2, X} from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';
import {ENTITY_CONFIG, type EntityView} from '@/components/entity-config';
import {EntityEditor} from '@/components/entity-editor';
import {EntityRow} from '@/components/entity-row';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {
  Badge,
  Button,
  ConfirmDialog,
  DialogShell,
  IconButton,
  SelectField,
  TextField,
} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import type {BudgetView, EntityKind, FinanceData, RecurringPaymentView, TransactionView} from '@/types/finance';
import {formatCurrency, formatDate} from '@/utils/format';
import {downloadTextFile, serializeJson, serializeRecordsCsv} from '@/utils/export';

const PAGE_SIZE = 10;

type ImpactTab = 'transactions' | 'recurring' | 'budgets';

function DeletionImpact({
  kind,
  selectedItems,
  data,
}: {
  kind: EntityKind;
  selectedItems: EntityView[];
  data: FinanceData;
}) {
  const [tab, setTab] = useState<ImpactTab>('transactions');
  const categoryIds = new Set(kind === 'categories' ? selectedItems.map(item => item.id) : []);
  const paymentMethodIds = new Set(kind === 'payment-methods' ? selectedItems.map(item => item.id) : []);
  const transactions = data.transactions.filter(
    item => categoryIds.has(item.categoryId) || paymentMethodIds.has(item.paymentMethodId),
  );
  const recurring = data.recurring.filter(
    item => categoryIds.has(item.categoryId) || paymentMethodIds.has(item.paymentMethodId),
  );
  const budgets = data.budgets.filter(item => item.categoryIds.some(categoryId => categoryIds.has(categoryId)));
  const items = {transactions, recurring, budgets};
  const labels: Record<ImpactTab, string> = {
    transactions: 'Transactions',
    recurring: 'Recurring payments',
    budgets: 'Budgets',
  };

  return (
    <div className="deletion-impact" aria-label="Deletion impact">
      <div className="deletion-impact-tabs" role="tablist" aria-label="Affected entities">
        {(Object.keys(labels) as ImpactTab[]).map(item => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? 'deletion-impact-tab active' : 'deletion-impact-tab'}
            onClick={() => setTab(item)}
          >
            {labels[item]} <Badge tone={items[item].length > 0 ? 'danger' : 'neutral'}>{items[item].length}</Badge>
          </button>
        ))}
      </div>
      <div role="tabpanel" className="deletion-impact-list">
        {items[tab].length === 0 ? (
          <p className="muted">No affected {labels[tab].toLocaleLowerCase()}.</p>
        ) : (
          items[tab].map(item => {
            if (tab === 'transactions') {
              const transaction = item as TransactionView;
              return (
                <div className="deletion-impact-row" key={transaction.id}>
                  <span>
                    <strong>{transaction.receiver}</strong>
                    <small>{formatDate(transaction.processedAt)}</small>
                  </span>
                  <strong>{formatCurrency(transaction.transferAmount)}</strong>
                </div>
              );
            }
            if (tab === 'recurring') {
              const payment = item as RecurringPaymentView;
              return (
                <div className="deletion-impact-row" key={payment.id}>
                  <span>
                    <strong>{payment.receiver}</strong>
                    <small>Next: {formatDate(payment.nextExecutionAt)}</small>
                  </span>
                  <strong>{formatCurrency(payment.transferAmount)}</strong>
                </div>
              );
            }
            const budget = item as BudgetView;
            return (
              <div className="deletion-impact-row" key={budget.id}>
                <span>
                  <strong>{budget.name}</strong>
                  <small>{budget.categoryNames.join(', ') || 'No categories'}</small>
                </span>
                <strong>{formatCurrency(budget.budget)}</strong>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function searchableText(item: EntityView) {
  return Object.values(item)
    .filter(value => typeof value === 'string')
    .join(' ')
    .toLocaleLowerCase();
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
  const config = ENTITY_CONFIG[kind];
  const meta = config.meta;
  const query = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? (kind === 'transactions' ? 'date-desc' : 'name-asc');
  const typeFilter = searchParams.get('type') ?? '';
  const categoryFilter = searchParams.get('category') ?? '';
  const methodFilter = searchParams.get('method') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const fromFilter = searchParams.get('from') ?? '';
  const toFilter = searchParams.get('to') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const source = config.select(data);
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
      return config.name(a).localeCompare(config.name(b)) * (sort === 'name-desc' ? -1 : 1);
    });
  }, [categoryFilter, config, fromFilter, kind, methodFilter, query, sort, source, statusFilter, toFilter, typeFilter]);
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
  const mergeable = config.mergeable === true && (kind === 'categories' || kind === 'payment-methods');
  const selectedItems = source.filter(item => selected.includes(item.id));
  const exportItems = selectedItems.length > 0 ? selectedItems : filtered;
  const deleteSelected = async () => {
    const deletedIds = new Set<string>();
    for (const item of selectedItems) {
      if (await deleteEntity(kind, item.id)) deletedIds.add(item.id);
    }
    setSelected(current => current.filter(id => !deletedIds.has(id)));
  };
  const exportFilename = `budgetbuddy-${kind}${selectedItems.length > 0 ? '-selected' : ''}`;
  const exportCsv = () => {
    downloadTextFile(serializeRecordsCsv(exportItems), 'text/csv;charset=utf-8', `${exportFilename}.csv`);
  };
  const exportJson = () => {
    downloadTextFile(serializeJson(exportItems), 'application/json;charset=utf-8', `${exportFilename}.json`);
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
              >
                {(kind === 'categories' || kind === 'payment-methods') && (
                  <DeletionImpact kind={kind} selectedItems={selectedItems} data={data} />
                )}
              </ConfirmDialog>
            )}
            <Button variant="secondary" size="sm" disabled={exportItems.length === 0} onClick={exportCsv}>
              <Download size={15} /> {selected.length > 0 ? 'Export selected CSV' : 'Export CSV'}
            </Button>
            <Button variant="secondary" size="sm" disabled={exportItems.length === 0} onClick={exportJson}>
              <Download size={15} /> {selected.length > 0 ? 'Export selected JSON' : 'Export JSON'}
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
              {config.headers.map(header => (
                <span key={header} className={header === 'Amount' ? 'align-right' : undefined}>
                  {header}
                </span>
              ))}
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
                deletionImpact={
                  kind === 'categories' || kind === 'payment-methods' ? (
                    <DeletionImpact kind={kind} selectedItems={[item]} data={data} />
                  ) : undefined
                }
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
        title={`Merge ${meta.title.toLocaleLowerCase()}`}
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
                {config.name(item)}
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
