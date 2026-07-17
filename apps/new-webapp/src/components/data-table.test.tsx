import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {DataTable} from './data-table';

const rows = [
  {id: '1', name: 'Rent'},
  {id: '2', name: 'Salary'},
];
const columns = [{key: 'name', header: 'Name', cell: (row: (typeof rows)[number]) => row.name}];

describe('DataTable', () => {
  it('renders rows, columns, and row actions', () => {
    render(
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={row => row.id}
        emptyTitle="No data"
        rowActions={row => <button>Edit {row.name}</button>}
      />,
    );
    expect(screen.getByRole('columnheader', {name: 'Name'})).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Edit Salary'})).toBeInTheDocument();
  });

  it('reports individual and all-row selection', () => {
    const onSelectionChange = vi.fn();
    const view = render(
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={row => row.id}
        emptyTitle="No data"
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Select row 1'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['1']);
    fireEvent.click(screen.getByLabelText('Select all rows'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['1', '2']);
    view.rerender(
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={row => row.id}
        emptyTitle="No data"
        selectedIds={['1', '2']}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(screen.getByLabelText('Select all rows')).toBeChecked();
  });

  it('renders a meaningful empty state', () => {
    render(<DataTable rows={[]} columns={columns} rowKey={row => row.id} emptyTitle="No transactions" />);
    expect(screen.getByText('No transactions')).toBeInTheDocument();
  });
});
