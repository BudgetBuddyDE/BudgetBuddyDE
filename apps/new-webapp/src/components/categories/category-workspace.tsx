'use client';

import type {TCategory} from '@budgetbuddyde/api/category';
import {Merge, Pencil, Plus, Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {type FormEvent, useEffect, useState} from 'react';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {DataTable, type DataColumn} from '@/components/data-table';
import {FeedbackPanel} from '@/components/feedback-panel';
import {IntentObjectPicker} from '@/components/intent-object-picker';
import {Pagination} from '@/components/pagination';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {deleteCategory, inspectCategoryImpact, mergeCategories} from '@/lib/category-mutations';
import {formatCurrency} from '@/utils/money';
import {CategoryDialog} from './category-dialog';

export function CategoryWorkspace({
  initialCategories,
  totalCount,
  search,
  page,
  pageSize,
  initialCreate,
  intentObject,
  error,
}: {
  initialCategories: TCategory[];
  totalCount: number;
  search: string;
  page: number;
  pageSize: number;
  initialCreate?: boolean;
  intentObject?: string;
  error?: string;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<TCategory>();
  const [createOpen, setCreateOpen] = useState(false);
  const [intentMatches, setIntentMatches] = useState<TCategory[]>([]);
  const [deleting, setDeleting] = useState<TCategory>();
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{kind: 'success' | 'error'; message: string}>();

  useEffect(() => setCategories(initialCategories), [initialCategories]);
  useEffect(() => {
    if (initialCreate) setCreateOpen(true);
    if (!intentObject) return;
    const normalized = intentObject.toLocaleLowerCase();
    const matches = initialCategories.filter(category => category.name.toLocaleLowerCase().includes(normalized));
    if (matches.length === 1) setEditing(matches[0]);
    else if (matches.length > 1) setIntentMatches(matches);
    else setStatus({kind: 'error', message: 'No category matches this intent.'});
  }, [initialCategories, initialCreate, intentObject]);
  const navigate = (next: {search?: string; page?: number; pageSize?: number}) => {
    const params = new URLSearchParams();
    const nextSearch = next.search ?? search;
    const nextPage = next.page ?? page;
    const nextPageSize = next.pageSize ?? pageSize;
    if (nextSearch) params.set('search', nextSearch);
    if (nextPage !== 1) params.set('page', String(nextPage));
    if (nextPageSize !== 25) params.set('pageSize', String(nextPageSize));
    router.push(params.size ? `/categories?${params}` : '/categories');
  };
  const refresh = (message: string) => {
    setStatus({kind: 'success', message});
    setSelectedIds([]);
    router.refresh();
  };
  const requestDelete = async (category: TCategory) => {
    setPending(true);
    const impact = await inspectCategoryImpact(category.id);
    setPending(false);
    if (!impact) {
      setStatus({kind: 'error', message: 'Related data could not be inspected. Nothing was deleted.'});
      return;
    }
    if (impact.transactions || impact.recurringPayments) {
      setStatus({
        kind: 'error',
        message: `${category.name} is used by ${impact.transactions} transaction(s) and ${impact.recurringPayments} recurring payment(s). Merge it before deletion.`,
      });
      return;
    }
    setDeleting(category);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setPending(true);
    const success = await deleteCategory(deleting.id);
    setPending(false);
    if (!success) {
      setStatus({kind: 'error', message: 'The category is now in use or could not be deleted.'});
      setDeleting(undefined);
      return;
    }
    setCategories(current => current.filter(category => category.id !== deleting.id));
    setDeleting(undefined);
    refresh('Category deleted.');
  };
  const merge = async () => {
    if (!mergeTarget || !selectedIds.length) return;
    setPending(true);
    const success = await mergeCategories(selectedIds as TCategory['id'][], mergeTarget as TCategory['id']);
    setPending(false);
    if (!success) {
      setStatus({kind: 'error', message: 'Categories could not be merged. No ambiguous merge was applied.'});
      return;
    }
    setMergeOpen(false);
    refresh('Categories merged and assignments updated.');
  };

  if (error)
    return (
      <FeedbackPanel
        kind="error"
        title="Categories unavailable"
        description={error}
        action={<Button onClick={() => router.refresh()}>Try again</Button>}
      />
    );
  const columns: DataColumn<TCategory>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: category => (
        <span className="flex items-center gap-2 font-medium">
          <span aria-hidden="true" className="size-3 rounded-full border" style={{backgroundColor: category.color}} />
          {category.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: category =>
        category.type === 'both' ? 'Income and expense' : category.type === 'income' ? 'Income' : 'Expense',
    },
    {
      key: 'target',
      header: 'Monthly target',
      cell: category =>
        category.budgetTarget === null ? (
          <span className="text-muted-foreground">No target</span>
        ) : (
          formatCurrency(category.budgetTarget)
        ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: category => <span className="line-clamp-1 text-muted-foreground">{category.description || '—'}</span>,
    },
  ];
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({search: String(new FormData(event.currentTarget).get('search') ?? ''), page: 1});
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Add category
        </Button>
        {selectedIds.length ? (
          <Button variant="outline" onClick={() => setMergeOpen(true)}>
            <Merge aria-hidden="true" className="size-4" />
            Merge selected ({selectedIds.length})
          </Button>
        ) : null}
      </div>
      <form onSubmit={submitSearch} className="flex max-w-xl gap-2">
        <input
          aria-label="Search categories"
          name="search"
          defaultValue={search}
          className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
          placeholder="Search categories"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
        {search ? (
          <Button type="button" variant="ghost" onClick={() => navigate({search: '', page: 1})}>
            Clear
          </Button>
        ) : null}
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
          rows={categories}
          columns={columns}
          rowKey={row => row.id}
          emptyTitle="No categories match this view"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          rowActions={row => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`} onClick={() => setEditing(row)}>
                <Pencil aria-hidden="true" className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.name}`}
                disabled={pending}
                onClick={() => requestDelete(row)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
          )}
        />
      </div>
      <div className="space-y-2 md:hidden">
        {categories.length ? (
          categories.map(category => (
            <article key={category.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full border" style={{backgroundColor: category.color}} />
                <h2 className="font-medium">{category.name}</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {category.type} · {category.budgetTarget === null ? 'No target' : formatCurrency(category.budgetTarget)}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(category)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => requestDelete(category)}>
                  Delete
                </Button>
              </div>
            </article>
          ))
        ) : (
          <FeedbackPanel kind="empty" title="No categories match this view" compact />
        )}
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={nextPage => navigate({page: nextPage})}
        onPageSizeChange={nextPageSize => navigate({page: 1, pageSize: nextPageSize})}
      />
      <IntentObjectPicker
        open={intentMatches.length > 1}
        title="Choose category to edit"
        options={intentMatches.map(category => ({
          id: category.id,
          label: category.name,
          description: category.description ?? undefined,
        }))}
        onSelect={id => {
          setEditing(intentMatches.find(category => category.id === id));
          setIntentMatches([]);
        }}
        onClose={() => setIntentMatches([])}
      />
      <CategoryDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => refresh('Category created.')} />
      <CategoryDialog
        open={Boolean(editing)}
        onOpenChange={open => !open && setEditing(undefined)}
        category={editing}
        onSaved={() => refresh('Category updated.')}
      />
      <DialogShell
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        title="Merge categories"
        description="All transactions, recurring payments, and budgets assigned to the selected sources move to the target."
        footer={
          <>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={merge} disabled={!mergeTarget || pending}>
              Merge categories
            </Button>
          </>
        }
      >
        <label className="space-y-2 text-sm font-medium">
          Target category
          <select
            aria-label="Target category"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={mergeTarget}
            onChange={event => setMergeTarget(event.target.value)}
          >
            <option value="">Select target</option>
            {categories
              .filter(category => !selectedIds.includes(category.id))
              .map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </label>
      </DialogShell>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={open => !open && setDeleting(undefined)}
        title="Delete category?"
        description="Only unused categories can be deleted. This action cannot be undone."
        impact="No transactions or recurring payments currently use this category."
        confirmLabel="Delete category"
        pending={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
