'use client';

import {ChevronLeft, ChevronRight, Pencil} from 'lucide-react';
import {useState} from 'react';
import {StatePanel} from '@/components/shared';
import {PageSizeControl} from '@/components/table-controls';
import {Button, DialogShell, IconButton} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {useI18n} from '@/lib/i18n';
import {DEFAULT_TABLE_PAGE_SIZE, type TablePageSize} from '@/lib/table-state';
import type {TransactionView} from '@/types/finance';

export interface TransactionScope {
  categoryIds?: readonly string[];
  excludeCategoryIds?: readonly string[];
  from?: Date;
  to?: Date;
  type?: 'income' | 'expense';
}

export function TransactionList({
  transactions,
  onEdit,
}: {
  transactions: readonly TransactionView[];
  onEdit?: (transaction: TransactionView) => void;
}) {
  const {t, formatCurrency, formatDate} = useI18n();
  return (
    <div className="dialog-transaction-list" role="table" aria-label={t('transaction.list')}>
      <div className="dialog-transaction-row header" role="row">
        <span>{t('transaction.singular')}</span>
        <span>{t('common.date')}</span>
        <span>{t('common.category')}</span>
        <span>{t('common.amount')}</span>
        {onEdit && <span aria-label={t('common.actions')} />}
      </div>
      {transactions.map(transaction => (
        <div key={transaction.id} className="dialog-transaction-row" role="row">
          <span className="table-primary">
            <strong>{transaction.receiver}</strong>
            <small>{transaction.information || t('common.noNote')}</small>
          </span>
          <span>{formatDate(transaction.processedAt)}</span>
          <span>{transaction.categoryName}</span>
          <strong className={transaction.transferAmount < 0 ? 'money expense' : 'money income'}>
            {formatCurrency(transaction.transferAmount)}
          </strong>
          {onEdit && (
            <IconButton
              aria-label={t('transaction.edit', {name: transaction.receiver})}
              onClick={() => onEdit(transaction)}
            >
              <Pencil size={15} aria-hidden="true" />
            </IconButton>
          )}
        </div>
      ))}
    </div>
  );
}

export function TransactionListDialog({
  open,
  onOpenChange,
  title,
  context,
  scope,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  context: string;
  scope: TransactionScope;
}) {
  const {t, formatCurrency} = useI18n();
  const {data, status, error, reload} = useFinance();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(DEFAULT_TABLE_PAGE_SIZE);
  const transactions = data.transactions
    .filter(transaction => !scope.categoryIds || scope.categoryIds.includes(transaction.categoryId))
    .filter(transaction => !scope.excludeCategoryIds?.includes(transaction.categoryId))
    .filter(transaction => !scope.from || transaction.processedAt >= scope.from)
    .filter(transaction => !scope.to || transaction.processedAt <= scope.to)
    .filter(
      transaction =>
        !scope.type || (scope.type === 'income' ? transaction.transferAmount > 0 : transaction.transferAmount < 0),
    )
    .toSorted((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
  const pageCount = Math.max(1, Math.ceil(transactions.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const total = transactions.reduce((sum, transaction) => sum + transaction.transferAmount, 0);

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={title} description={context}>
      <div className="transaction-dialog-content">
        <div className="transaction-dialog-summary" aria-label={t('transaction.scopeTotal')}>
          <span>{t('transaction.count', {count: transactions.length})}</span>
          <strong className={total < 0 ? 'money expense' : 'money income'}>{formatCurrency(total)}</strong>
        </div>
        {status === 'loading' && data.transactions.length === 0 ? (
          <StatePanel state="loading" />
        ) : status === 'error' ? (
          <StatePanel state="error" description={error ?? undefined} onRetry={() => void reload(true)} />
        ) : transactions.length === 0 ? (
          <StatePanel state="empty" title={t('transaction.empty')} description={t('transaction.emptyDescription')} />
        ) : (
          <TransactionList
            transactions={visible}
            onEdit={transaction => window.location.assign(`/transactions?intent=edit&id=${transaction.id}`)}
          />
        )}
        <div className="table-footer">
          <PageSizeControl
            label={t('common.rowsPerPage')}
            value={pageSize}
            onChange={value => {
              setPageSize(value);
              setPage(1);
            }}
          />
          <div>
            <IconButton
              aria-label={t('common.previousPage')}
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </IconButton>
            <span>{t('common.pageOf', {page: currentPage, count: pageCount})}</span>
            <IconButton
              aria-label={t('common.nextPage')}
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={17} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </DialogShell>
  );
}
