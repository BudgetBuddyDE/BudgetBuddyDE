'use client';

import {Menu as MenuPrimitive} from '@base-ui/react/menu';
import {Check, ChevronDown, Download, MoreHorizontal, Trash2, X} from 'lucide-react';
import type {ReactNode} from 'react';
import {Badge, Button, ConfirmDialog, IconButton, SelectField} from '@/components/ui/primitives';
import {TABLE_PAGE_SIZES, type TablePageSize} from '@/lib/table-state';

export interface FilterOption {
  value: string;
  label: string;
}

export function MultiSelectFilter({
  label,
  options,
  values,
  onChange,
  clearLabel,
}: {
  label: string;
  options: readonly FilterOption[];
  values: readonly string[];
  onChange: (values: string[]) => void;
  clearLabel: string;
}) {
  const selected = options.filter(option => values.includes(option.value));
  return (
    <div className="multi-filter">
      <MenuPrimitive.Root>
        <MenuPrimitive.Trigger className="button button-secondary button-sm multi-filter-trigger">
          {label}
          {values.length > 0 && <Badge tone="neutral">{values.length}</Badge>}
          <ChevronDown size={14} aria-hidden="true" />
        </MenuPrimitive.Trigger>
        <MenuPrimitive.Portal>
          <MenuPrimitive.Positioner sideOffset={6} align="start" className="menu-positioner">
            <MenuPrimitive.Popup className="menu-popup multi-filter-popup" aria-label={label}>
              <MenuPrimitive.Group>
                <MenuPrimitive.GroupLabel className="menu-label">{label}</MenuPrimitive.GroupLabel>
                {options.map(option => {
                  const checked = values.includes(option.value);
                  return (
                    <MenuPrimitive.CheckboxItem
                      key={option.value}
                      className="menu-item menu-checkbox-item"
                      checked={checked}
                      onCheckedChange={next =>
                        onChange(next ? [...values, option.value] : values.filter(value => value !== option.value))
                      }
                      closeOnClick={false}
                    >
                      <MenuPrimitive.CheckboxItemIndicator className="menu-check">
                        <Check size={14} aria-hidden="true" />
                      </MenuPrimitive.CheckboxItemIndicator>
                      {option.label}
                    </MenuPrimitive.CheckboxItem>
                  );
                })}
              </MenuPrimitive.Group>
            </MenuPrimitive.Popup>
          </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
      </MenuPrimitive.Root>
      {selected.length > 0 && (
        <div className="filter-chips" aria-label={`${label}: ${selected.map(option => option.label).join(', ')}`}>
          {selected.map(option => (
            <button
              key={option.value}
              type="button"
              className="filter-chip"
              aria-label={`${clearLabel}: ${option.label}`}
              onClick={() => onChange(values.filter(value => value !== option.value))}
            >
              {option.label} <X size={12} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface RowAction {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function RowActionMenu({label, actions}: {label: string; actions: readonly RowAction[]}) {
  if (actions.length === 0) return null;
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger render={<IconButton aria-label={label} onClick={event => event.stopPropagation()} />}>
        <MoreHorizontal size={17} aria-hidden="true" />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={5} align="end" className="menu-positioner">
          <MenuPrimitive.Popup className="menu-popup row-menu" aria-label={label}>
            {actions.map(action => (
              <MenuPrimitive.Item
                key={action.id}
                className={`menu-item${action.danger ? ' menu-item-danger' : ''}`}
                disabled={action.disabled}
                onClick={event => {
                  event.stopPropagation();
                  action.onSelect();
                }}
              >
                {action.icon}
                {action.label}
              </MenuPrimitive.Item>
            ))}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

export function ExportMenu({
  label,
  csvLabel,
  jsonLabel,
  disabled,
  onExport,
}: {
  label: string;
  csvLabel: string;
  jsonLabel: string;
  disabled?: boolean;
  onExport: (format: 'csv' | 'json') => void;
}) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger disabled={disabled} render={<Button variant="secondary" size="sm" aria-label={label} />}>
        <Download size={15} aria-hidden="true" /> {label}
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={5} align="end" className="menu-positioner">
          <MenuPrimitive.Popup className="menu-popup" aria-label={label}>
            <MenuPrimitive.Item className="menu-item" onClick={() => onExport('csv')}>
              {csvLabel}
            </MenuPrimitive.Item>
            <MenuPrimitive.Item className="menu-item" onClick={() => onExport('json')}>
              {jsonLabel}
            </MenuPrimitive.Item>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

export function PageSizeControl({
  value,
  label,
  onChange,
}: {
  value: TablePageSize;
  label: string;
  onChange: (value: TablePageSize) => void;
}) {
  return (
    <SelectField
      label={label}
      className="compact-field page-size-control"
      value={value}
      onChange={event => onChange(Number(event.target.value) as TablePageSize)}
    >
      {TABLE_PAGE_SIZES.map(size => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </SelectField>
  );
}

export function BulkActionToolbar({
  count,
  entityLabel,
  selectionLabel,
  deleteLabel,
  exportLabel,
  exportCsvLabel,
  exportJsonLabel,
  confirmTitle,
  confirmDescription,
  busy,
  canDelete,
  onDelete,
  onExport,
}: {
  count: number;
  entityLabel: string;
  selectionLabel: string;
  deleteLabel: string;
  exportLabel: string;
  exportCsvLabel: string;
  exportJsonLabel: string;
  confirmTitle: string;
  confirmDescription: string;
  busy?: boolean;
  canDelete: boolean;
  onDelete: () => Promise<void> | void;
  onExport: (format: 'csv' | 'json') => void;
}) {
  if (count === 0) return null;
  return (
    <div className="bulk-toolbar" role="toolbar" aria-label={`${selectionLabel}: ${count} ${entityLabel}`}>
      <Badge tone="neutral">
        {selectionLabel}: {count}
      </Badge>
      {canDelete && (
        <ConfirmDialog
          trigger={
            <Button variant="danger" size="sm">
              <Trash2 size={15} aria-hidden="true" /> {deleteLabel}
            </Button>
          }
          title={confirmTitle}
          description={confirmDescription}
          confirmLabel={deleteLabel}
          busy={busy}
          onConfirm={onDelete}
        />
      )}
      <ExportMenu label={exportLabel} csvLabel={exportCsvLabel} jsonLabel={exportJsonLabel} onExport={onExport} />
    </div>
  );
}
