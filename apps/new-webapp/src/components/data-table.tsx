'use client';

import type {ReactNode} from 'react';
import {FeedbackPanel} from '@/components/feedback-panel';
import {cn} from '@/utils/cn';

export interface DataColumn<Row> {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
}

interface DataTableProps<Row> {
  rows: Row[];
  columns: DataColumn<Row>[];
  rowKey: (row: Row) => string;
  emptyTitle: string;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowActions?: (row: Row) => ReactNode;
}

export function DataTable<Row>({
  rows,
  columns,
  rowKey,
  emptyTitle,
  selectedIds,
  onSelectionChange,
  rowActions,
}: DataTableProps<Row>) {
  if (!rows.length) return <FeedbackPanel kind="empty" title={emptyTitle} />;
  const selected = new Set(selectedIds ?? []);
  const selectable = Boolean(onSelectionChange);
  const allSelected = selectable && rows.every(row => selected.has(rowKey(row)));

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <tr>
            {selectable ? (
              <th className="w-10 px-3 py-2">
                <input
                  aria-label="Select all rows"
                  type="checkbox"
                  checked={allSelected}
                  onChange={event => onSelectionChange?.(event.target.checked ? rows.map(rowKey) : [])}
                />
              </th>
            ) : null}
            {columns.map(column => (
              <th key={column.key} className={cn('whitespace-nowrap px-3 py-2', column.className)}>
                {column.header}
              </th>
            ))}
            {rowActions ? (
              <th className="w-20 px-3 py-2 text-right">
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const id = rowKey(row);
            return (
              <tr key={id} className="border-t hover:bg-muted/35">
                {selectable ? (
                  <td className="px-3 py-2">
                    <input
                      aria-label={`Select row ${id}`}
                      type="checkbox"
                      checked={selected.has(id)}
                      onChange={event =>
                        onSelectionChange?.(
                          event.target.checked ? [...selected, id] : [...selected].filter(value => value !== id),
                        )
                      }
                    />
                  </td>
                ) : null}
                {columns.map(column => (
                  <td key={column.key} className={cn('max-w-[22rem] px-3 py-2 align-middle', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
                {rowActions ? <td className="px-3 py-2 text-right">{rowActions(row)}</td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
