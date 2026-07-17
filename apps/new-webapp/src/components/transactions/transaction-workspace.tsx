'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {Download, Paperclip, Pencil, Plus, Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {type FormEvent, useEffect, useMemo, useState} from 'react';
import {TransactionAttachmentsDialog} from '@/components/attachments/transaction-attachments-dialog';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {DataTable, type DataColumn} from '@/components/data-table';
import {FeedbackPanel} from '@/components/feedback-panel';
import {IntentObjectPicker} from '@/components/intent-object-picker';
import {Pagination} from '@/components/pagination';
import {Button, buttonVariants} from '@/components/ui/button';
import {deleteTransaction} from '@/lib/transaction-mutations';
import {formatDate} from '@/utils/date';
import {formatCurrency} from '@/utils/money';
import {serializeTransactionQuery, type TransactionQuery} from '@/utils/transaction-query';
import {BulkTransactionDialog} from './bulk-transaction-dialog';
import {TransactionDialog} from './transaction-dialog';

interface TransactionWorkspaceProps {
  initialTransactions: TExpandedTransaction[];
  totalCount: number;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  query: TransactionQuery;
  initialIntent?: 'create' | 'edit' | 'attach';
  intentObject?: string;
  error?: string;
}

export function TransactionWorkspace({
  initialTransactions,
  totalCount,
  categories,
  paymentMethods,
  query,
  initialIntent,
  intentObject,
  error,
}: TransactionWorkspaceProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<TExpandedTransaction>();
  const [attachmentTransaction, setAttachmentTransaction] = useState<TExpandedTransaction>();
  const [createOpen, setCreateOpen] = useState(false);
  const [intentMatches, setIntentMatches] = useState<TExpandedTransaction[]>([]);
  const [deleting, setDeleting] = useState<TExpandedTransaction>();
  const [deletePending, setDeletePending] = useState(false);
  const [status, setStatus] = useState<{kind: 'success' | 'error'; message: string}>();

  useEffect(() => {
    if (initialIntent === 'create') {
      setCreateOpen(true);
      return;
    }
    if (initialIntent !== 'edit' && initialIntent !== 'attach') return;
    const normalized = intentObject?.toLocaleLowerCase();
    const matches = normalized
      ? initialTransactions.filter(transaction =>
          `${transaction.receiver} ${transaction.information ?? ''}`.toLocaleLowerCase().includes(normalized),
        )
      : initialTransactions;
    if (matches.length === 1) {
      if (initialIntent === 'edit') setEditing(matches[0]);
      else setAttachmentTransaction(matches[0]);
    } else if (matches.length > 1) setIntentMatches(matches);
    else setStatus({kind: 'error', message: 'No transaction matches this intent.'});
  }, [initialIntent, initialTransactions, intentObject]);

  useEffect(() => {
    setTransactions(initialTransactions);
    setSelectedIds(current => current.filter(id => initialTransactions.some(transaction => transaction.id === id)));
  }, [initialTransactions]);

  const selectedTransactions = useMemo(
    () => transactions.filter(transaction => selectedIds.includes(transaction.id)),
    [selectedIds, transactions],
  );
  const navigate = (next: TransactionQuery) => {
    const params = serializeTransactionQuery(next).toString();
    router.push(params ? `/transactions?${params}` : '/transactions');
  };
  const refreshAfterMutation = () => {
    setStatus({kind: 'success', message: 'Transactions updated.'});
    setSelectedIds([]);
    router.refresh();
  };

  const columns: DataColumn<TExpandedTransaction>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: row => <span className="whitespace-nowrap">{formatDate(row.processedAt)}</span>,
    },
    {
      key: 'receiver',
      header: 'Receiver',
      cell: row => (
        <div className="truncate font-medium" title={row.receiver}>
          {row.receiver}
        </div>
      ),
    },
    {key: 'category', header: 'Category', cell: row => row.category.name},
    {key: 'payment', header: 'Payment method', cell: row => row.paymentMethod.name},
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      cell: row => (
        <span className={row.transferAmount < 0 ? 'text-destructive' : 'text-success'}>
          <span className="sr-only">{row.transferAmount < 0 ? 'Expense' : 'Income'}: </span>
          {formatCurrency(row.transferAmount)}
        </span>
      ),
    },
  ];

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    navigate({
      ...query,
      search: String(data.get('search') ?? ''),
      dateFrom: String(data.get('from') ?? '') || undefined,
      dateTo: String(data.get('to') ?? '') || undefined,
      type: String(data.get('type')) as TransactionQuery['type'],
      categories: data.get('category') ? [String(data.get('category'))] : [],
      paymentMethods: data.get('paymentMethod') ? [String(data.get('paymentMethod'))] : [],
      sort: String(data.get('sort')) as TransactionQuery['sort'],
      order: String(data.get('order')) as TransactionQuery['order'],
      page: 1,
    });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const deleted = await deleteTransaction(deleting.id);
    setDeletePending(false);
    if (!deleted) {
      setStatus({kind: 'error', message: 'The transaction could not be deleted. Try again.'});
      setDeleting(undefined);
      return;
    }
    setTransactions(current => current.filter(transaction => transaction.id !== deleting.id));
    setDeleting(undefined);
    setStatus({kind: 'success', message: 'Transaction deleted.'});
    router.refresh();
  };

  if (error)
    return (
      <FeedbackPanel
        kind="error"
        title="Transactions unavailable"
        description={error}
        action={<Button onClick={() => router.refresh()}>Try again</Button>}
      />
    );

  const exportParams = serializeTransactionQuery(query);
  exportParams.delete('page');
  exportParams.delete('pageSize');
  exportParams.set('scope', 'filtered');
  exportParams.set('format', 'csv');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Add transaction
        </Button>
        <BulkTransactionDialog
          mode="create"
          categories={categories}
          paymentMethods={paymentMethods}
          onSaved={refreshAfterMutation}
        />
        <BulkTransactionDialog
          mode="edit"
          transactions={selectedTransactions}
          categories={categories}
          paymentMethods={paymentMethods}
          onSaved={refreshAfterMutation}
        />
        <a
          className={buttonVariants({variant: 'outline'})}
          href={`/api/export/transactions?${exportParams.toString()}`}
        >
          <Download aria-hidden="true" className="size-4" />
          Export filtered CSV
        </a>
      </div>
      <form
        onSubmit={submitFilters}
        className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"
      >
        <input
          aria-label="Search transactions"
          name="search"
          defaultValue={query.search}
          placeholder="Search"
          className="h-9 rounded-md border bg-background px-3 text-sm xl:col-span-2"
        />
        <input
          aria-label="From date"
          name="from"
          type="date"
          defaultValue={query.dateFrom}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        />
        <input
          aria-label="To date"
          name="to"
          type="date"
          defaultValue={query.dateTo}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        />
        <select
          aria-label="Transaction type"
          name="type"
          defaultValue={query.type}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select
          aria-label="Category filter"
          name="category"
          defaultValue={query.categories[0] ?? ''}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Payment method filter"
          name="paymentMethod"
          defaultValue={query.paymentMethods[0] ?? ''}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">All payment methods</option>
          {paymentMethods.map(method => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            aria-label="Sort transactions"
            name="sort"
            defaultValue={query.sort}
            className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="category">Category</option>
          </select>
          <select
            aria-label="Sort order"
            name="order"
            defaultValue={query.order}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <div className="flex gap-2 xl:col-span-8">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              navigate({
                ...query,
                search: '',
                dateFrom: undefined,
                dateTo: undefined,
                type: 'all',
                categories: [],
                paymentMethods: [],
                sort: 'date',
                order: 'desc',
                page: 1,
              })
            }
          >
            Clear
          </Button>
        </div>
      </form>
      {status ? (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={
            status.kind === 'error'
              ? 'rounded-md bg-destructive/10 p-3 text-sm text-destructive'
              : 'rounded-md bg-success/10 p-3 text-sm'
          }
        >
          {status.message}
        </p>
      ) : null}
      <div className="hidden md:block">
        <DataTable
          rows={transactions}
          columns={columns}
          rowKey={row => row.id}
          emptyTitle="No transactions match this view"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          rowActions={row => (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Attachments ${row.receiver}`}
                onClick={() => setAttachmentTransaction(row)}
              >
                <Paperclip aria-hidden="true" className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Edit ${row.receiver}`} onClick={() => setEditing(row)}>
                <Pencil aria-hidden="true" className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.receiver}`}
                onClick={() => setDeleting(row)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
          )}
        />
      </div>
      <div className="space-y-2 md:hidden">
        {transactions.length ? (
          transactions.map(row => (
            <article key={row.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{row.receiver}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(row.processedAt)} · {row.category.name} · {row.paymentMethod.name}
                  </p>
                </div>
                <p className={row.transferAmount < 0 ? 'font-semibold text-destructive' : 'font-semibold text-success'}>
                  {formatCurrency(row.transferAmount)}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAttachmentTransaction(row)}>
                  Attachments {row.attachmentCount ? `(${row.attachmentCount})` : ''}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>
                  Delete
                </Button>
              </div>
            </article>
          ))
        ) : (
          <FeedbackPanel kind="empty" title="No transactions match this view" compact />
        )}
      </div>
      <Pagination
        page={query.page}
        pageSize={query.pageSize}
        totalCount={totalCount}
        onPageChange={page => navigate({...query, page})}
        onPageSizeChange={pageSize => navigate({...query, page: 1, pageSize})}
      />
      <IntentObjectPicker
        open={intentMatches.length > 1}
        title={initialIntent === 'attach' ? 'Choose transaction for attachment' : 'Choose transaction to edit'}
        options={intentMatches.map(transaction => ({
          id: transaction.id,
          label: transaction.receiver,
          description: formatDate(transaction.processedAt),
        }))}
        onSelect={id => {
          const transaction = intentMatches.find(item => item.id === id);
          setIntentMatches([]);
          if (initialIntent === 'attach') setAttachmentTransaction(transaction);
          else setEditing(transaction);
        }}
        onClose={() => setIntentMatches([])}
      />
      <TransactionAttachmentsDialog
        transaction={attachmentTransaction}
        onOpenChange={open => !open && setAttachmentTransaction(undefined)}
        onChanged={() => router.refresh()}
      />
      <TransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        paymentMethods={paymentMethods}
        onSaved={refreshAfterMutation}
      />
      <TransactionDialog
        open={Boolean(editing)}
        onOpenChange={open => !open && setEditing(undefined)}
        transaction={editing}
        categories={categories}
        paymentMethods={paymentMethods}
        onSaved={refreshAfterMutation}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={open => !open && setDeleting(undefined)}
        title="Delete transaction?"
        description="This action cannot be undone."
        impact={
          deleting?.attachmentCount
            ? `${deleting.attachmentCount} linked attachment${deleting.attachmentCount === 1 ? '' : 's'} will also be deleted.`
            : 'The transaction will be removed permanently.'
        }
        confirmLabel="Delete transaction"
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
