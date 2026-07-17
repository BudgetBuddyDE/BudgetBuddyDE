'use client';

import {Button} from '@/components/ui/button';

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const first = totalCount ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, totalCount);
  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        {first}–{last} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="page-size">Rows</label>
        <select
          id="page-size"
          className="h-8 rounded-md border bg-background px-2"
          value={pageSize}
          onChange={event => onPageSizeChange(Number(event.target.value))}
        >
          {[10, 25, 50, 100].map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span aria-label="Current page">
          {page} / {pageCount}
        </span>
        <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
