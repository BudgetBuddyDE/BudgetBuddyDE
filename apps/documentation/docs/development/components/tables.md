---
title: Tables
icon: lucide/table
tags: [development, components]
---

## Overview

| Component         | Base           | Use Case                        |
|-------------------|----------------|---------------------------------|
| `BasicTable`      | MUI Table      | Simple tables                   |
| `EntityTable`     | BasicTable     | + Slice integration, selection  |
| `DataTable`       | MUI-X DataGrid | Sorting, filtering, inline edit |
| `EntityDataTable` | DataTable      | + Slice integration             |

## `<BasicTable />`

Simple table with custom rendering.

```tsx
import {BasicTable, type ColumnDefinition} from '@/components/Table';

const columns: ColumnDefinition<User>[] = [
  {key: 'name', label: 'Name'},
  {key: 'email', label: 'E-Mail'},
];

<BasicTable data={users} dataKey="id" columns={columns} />
```

## `<EntityTable />`

For Redux slices with pagination and selection.

```tsx
import {EntityTable, type EntitySlice, type ColumnDefinition} from '@/components/Table';

const slice: EntitySlice<Transaction> = {
  data: transactions,
  isLoading: false,
  error: null,
  totalCount: 100,
};

<EntityTable
  slice={slice}
  dataKey="id"
  columns={columns}
  toolbar={{title: 'Transactions', showCount: true}}
  pagination={{page, rowsPerPage, onPageChange, onRowsPerPageChange}}
  withSelection
  onDeleteSelectedEntities={(ids) => handleDelete(ids)}
  selectionActions={[{label: 'Merge', onClick: handleMerge}]}
/>
```

## `<DataTable />`

MUI-X DataGrid wrapper with sorting, filtering and inline editing.

```tsx
import {DataTable, type DataTableColumn} from '@/components/Table';

const columns: DataTableColumn<Product>[] = [
  {field: 'name', headerName: 'Product', flex: 1, editable: true},
  {field: 'price', headerName: 'Price', type: 'number'},
];

<DataTable
  data={products}
  columns={columns}
  checkboxSelection
  sortModel={sortModel}
  onSortModelChange={setSortModel}
  processRowUpdate={handleSave}
/>
```

## `<EntityDataTable />`

DataTable with Slice integration.

```tsx
<EntityDataTable
  slice={slice}
  columns={columns}
  toolbar={{title: 'Products', showCount: true}}
  paginationMode="server"
/>
```

## Helper Components

### TableToolbar

```tsx
<TableToolbar
  title="Title"
  subtitle="Subtitle"
  showSearch
  onSearch={handleSearch}
  actions={[{id: 'add', icon: <AddRounded />, label: 'Add', onClick: handleAdd}]}
/>
```

### EntityMenu

Row-Actions Menu.

```tsx
<EntityMenu
  entity={row}
  handleEditEntity={handleEdit}
  handleDeleteEntity={handleDelete}
  actions={[{children: 'Pause', onClick: handlePause}]}
/>
```

### Pagination

```tsx
<Pagination
  count={100}
  page={0}
  rowsPerPage={10}
  onPageChange={setPage}
  onRowsPerPageChange={setRowsPerPage}
/>
```

## Types

```tsx
// BasicTable
type ColumnDefinition<T> = {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  renderCell?: (value: T[keyof T], row: T, index: number) => ReactNode;
  renderHeader?: () => ReactNode;
};

// EntityTable
type EntitySlice<T> = {
  data: T[];
  isLoading: boolean;
  error: string | Error | null;
  totalCount?: number;
};

type SelectionAction<T> = {
  label: ReactNode;
  onClick: (selectedEntities: T[]) => void;
};

// DataTable
type DataTableColumn<T> = GridColDef<T>;  // MUI-X
```