import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {DataTableColumn} from '../DataTable';
import type {EntitySlice} from '../EntityTable';
import {EntityDataTable} from './EntityDataTable';

type Order = {
  id: number;
  customer: string;
  total: number;
  status: string;
};

const mockOrders: Order[] = [
  {id: 1, customer: 'John Doe', total: 150, status: 'Completed'},
  {id: 2, customer: 'Jane Smith', total: 250, status: 'Pending'},
  {id: 3, customer: 'Bob Wilson', total: 99, status: 'Shipped'},
];

const mockColumns: DataTableColumn<Order>[] = [
  {field: 'id', headerName: 'Order ID', width: 100},
  {field: 'customer', headerName: 'Customer', width: 150},
  {field: 'total', headerName: 'Total', width: 100, type: 'number'},
  {field: 'status', headerName: 'Status', width: 120},
];

describe('EntityDataTable', () => {
  it('renders data from slice', async () => {
    const slice: EntitySlice<Order> = {
      data: mockOrders,
      isLoading: false,
      error: null,
    };

    render(<EntityDataTable slice={slice} columns={mockColumns} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows loading state from slice', async () => {
    const slice: EntitySlice<Order> = {
      data: [],
      isLoading: true,
      error: null,
    };

    const {container} = render(<EntityDataTable slice={slice} columns={mockColumns} />);

    await waitFor(() => {
      // DataGrid shows loading overlay
      const grid = container.querySelector('.MuiDataGrid-root');
      expect(grid).toBeInTheDocument();
    });
  });

  it('shows error state from slice', () => {
    const slice: EntitySlice<Order> = {
      data: [],
      isLoading: false,
      error: 'Failed to fetch orders',
    };

    render(<EntityDataTable slice={slice} columns={mockColumns} />);
    expect(screen.getByText('Failed to fetch orders')).toBeInTheDocument();
  });

  it('shows empty state when data is empty', async () => {
    const slice: EntitySlice<Order> = {
      data: [],
      isLoading: false,
      error: null,
    };

    render(<EntityDataTable slice={slice} columns={mockColumns} emptyMessage="No orders found" />);

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });
  });

  it('shows count in toolbar title when showCount is true', async () => {
    const slice: EntitySlice<Order> = {
      data: mockOrders,
      isLoading: false,
      error: null,
      totalCount: 50,
    };

    render(<EntityDataTable slice={slice} columns={mockColumns} toolbar={{title: 'Orders', showCount: true}} />);

    expect(screen.getByText('Orders (50)')).toBeInTheDocument();
  });

  it('uses data length when totalCount is not provided', async () => {
    const slice: EntitySlice<Order> = {
      data: mockOrders,
      isLoading: false,
      error: null,
    };

    render(<EntityDataTable slice={slice} columns={mockColumns} toolbar={{title: 'Orders', showCount: true}} />);

    expect(screen.getByText('Orders (3)')).toBeInTheDocument();
  });

  it('supports checkbox selection', async () => {
    const slice: EntitySlice<Order> = {
      data: mockOrders,
      isLoading: false,
      error: null,
    };

    const onSelectionChange = vi.fn();

    render(
      <EntityDataTable
        slice={slice}
        columns={mockColumns}
        checkboxSelection
        onRowSelectionModelChange={onSelectionChange}
      />,
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  it('handles pagination in server mode', async () => {
    const slice: EntitySlice<Order> = {
      data: mockOrders,
      isLoading: false,
      error: null,
      totalCount: 100,
    };

    const onPaginationChange = vi.fn();

    render(
      <EntityDataTable
        slice={slice}
        columns={mockColumns}
        paginationMode="server"
        paginationModel={{page: 0, pageSize: 10}}
        onPaginationModelChange={onPaginationChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles sorting model changes', async () => {
    const slice: EntitySlice<Order> = {
      data: mockOrders,
      isLoading: false,
      error: null,
    };

    const onSortChange = vi.fn();

    render(<EntityDataTable slice={slice} columns={mockColumns} onSortModelChange={onSortChange} />);

    await waitFor(() => {
      // Click on column header to sort
      const customerHeader = screen.getByText('Customer');
      fireEvent.click(customerHeader);
    });

    expect(onSortChange).toHaveBeenCalled();
  });

  it('applies density setting', async () => {
    const slice: EntitySlice<Order> = {
      data: mockOrders,
      isLoading: false,
      error: null,
    };

    const {container} = render(<EntityDataTable slice={slice} columns={mockColumns} density="compact" />);

    await waitFor(() => {
      const grid = container.querySelector('.MuiDataGrid-root');
      expect(grid).toHaveClass('MuiDataGrid-root--densityCompact');
    });
  });
});
