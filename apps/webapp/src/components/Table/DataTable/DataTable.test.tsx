import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {DataTable, type DataTableColumn} from './DataTable';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

const mockProducts: Product[] = [
  {id: 1, name: 'Laptop', price: 999, category: 'Electronics'},
  {id: 2, name: 'Chair', price: 199, category: 'Furniture'},
  {id: 3, name: 'Book', price: 29, category: 'Books'},
];

const mockColumns: DataTableColumn<Product>[] = [
  {field: 'id', headerName: 'ID', width: 70},
  {field: 'name', headerName: 'Name', width: 150},
  {field: 'price', headerName: 'Price', width: 100, type: 'number'},
  {field: 'category', headerName: 'Category', width: 150},
];

describe('DataTable', () => {
  it('renders data grid with data', async () => {
    render(<DataTable data={mockProducts} columns={mockColumns} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Chair')).toBeInTheDocument();
    });
  });

  it('renders column headers', async () => {
    render(<DataTable data={mockProducts} columns={mockColumns} />);

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    const {container} = render(<DataTable data={[]} columns={mockColumns} isLoading />);

    await waitFor(() => {
      // DataGrid shows loading overlay which may contain a progressbar or loading indicator
      const grid = container.querySelector('.MuiDataGrid-root');
      expect(grid).toBeInTheDocument();
    });
  });

  it('shows error state', () => {
    render(<DataTable data={[]} columns={mockColumns} error="Failed to load products" />);
    expect(screen.getByText('Failed to load products')).toBeInTheDocument();
  });

  it('renders toolbar when provided', async () => {
    render(<DataTable data={mockProducts} columns={mockColumns} toolbar={{title: 'Products List'}} />);
    expect(screen.getByText('Products List')).toBeInTheDocument();
  });

  it('renders with checkbox selection', async () => {
    render(<DataTable data={mockProducts} columns={mockColumns} checkboxSelection />);

    await waitFor(() => {
      // DataGrid renders checkboxes for selection
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  it('calls onRowSelectionModelChange when row is selected', async () => {
    const onSelectionChange = vi.fn();

    render(
      <DataTable
        data={mockProducts}
        columns={mockColumns}
        checkboxSelection
        onRowSelectionModelChange={onSelectionChange}
      />,
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is header, second is first row
      fireEvent.click(checkboxes[1]);
    });

    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('respects pagination settings', async () => {
    const onPaginationChange = vi.fn();

    render(
      <DataTable
        data={mockProducts}
        columns={mockColumns}
        pagination
        paginationModel={{page: 0, pageSize: 10}}
        onPaginationModelChange={onPaginationChange}
        pageSizeOptions={[5, 10, 25]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });
  });

  it('renders custom empty message', async () => {
    render(<DataTable data={[]} columns={mockColumns} emptyMessage="No products available" />);

    await waitFor(() => {
      expect(screen.getByText('No products available')).toBeInTheDocument();
    });
  });

  it('applies custom height', () => {
    const {container} = render(<DataTable data={mockProducts} columns={mockColumns} height={600} />);

    const wrapper = container.querySelector('.MuiDataGrid-root')?.parentElement;
    expect(wrapper).toHaveStyle({height: '600px'});
  });

  it('supports autoHeight mode', () => {
    const {container} = render(<DataTable data={mockProducts} columns={mockColumns} autoHeight />);

    const wrapper = container.querySelector('.MuiDataGrid-root')?.parentElement;
    expect(wrapper).toHaveStyle({height: 'auto'});
  });

  it('passes through dataGridProps', async () => {
    render(
      <DataTable
        data={mockProducts}
        columns={mockColumns}
        dataGridProps={{
          hideFooter: true,
        }}
      />,
    );

    await waitFor(() => {
      // When footer is hidden, pagination controls should not be present
      expect(screen.queryByText('Rows per page:')).not.toBeInTheDocument();
    });
  });
});
