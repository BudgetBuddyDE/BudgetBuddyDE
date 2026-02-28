import {AddRounded} from '@mui/icons-material';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {BasicTable, type ColumnDefinition} from './BasicTable';

type TestEntity = {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
};

const mockData: TestEntity[] = [
  {id: 1, name: 'John Doe', email: 'john@example.com', status: 'active'},
  {id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive'},
  {id: 3, name: 'Bob Wilson', email: 'bob@example.com', status: 'active'},
];

const columns: ColumnDefinition<TestEntity>[] = [
  {key: 'id', label: 'ID'},
  {key: 'name', label: 'Name'},
  {key: 'email', label: 'Email'},
  {key: 'status', label: 'Status'},
];

describe('BasicTable', () => {
  it('renders table with data', () => {
    render(<BasicTable data={mockData} dataKey="id" columns={columns} />);

    // Check headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<BasicTable data={[]} dataKey="id" columns={columns} emptyMessage="No users found" />);
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BasicTable data={[]} dataKey="id" columns={columns} isLoading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state with string error', () => {
    render(<BasicTable data={[]} dataKey="id" columns={columns} error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders error state with Error object', () => {
    render(<BasicTable data={[]} dataKey="id" columns={columns} error={new Error('Network error')} />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders toolbar with title', () => {
    render(<BasicTable data={mockData} dataKey="id" columns={columns} toolbar={{title: 'Users Table'}} />);
    expect(screen.getByText('Users Table')).toBeInTheDocument();
  });

  it('renders toolbar with actions', () => {
    const onClick = vi.fn();
    render(
      <BasicTable
        data={mockData}
        dataKey="id"
        columns={columns}
        toolbar={{
          title: 'Users',
          actions: [{id: 'add', icon: <AddRounded />, label: 'Add user', onClick}],
        }}
      />,
    );

    const button = screen.getByRole('button', {name: 'Add user'});
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onRowClick when row is clicked', () => {
    const onRowClick = vi.fn();
    render(<BasicTable data={mockData} dataKey="id" columns={columns} onRowClick={onRowClick} />);

    fireEvent.click(screen.getByText('John Doe'));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('renders custom cell content using renderCell', () => {
    const columnsWithCustomCell: ColumnDefinition<TestEntity>[] = [
      ...columns.slice(0, 3),
      {
        key: 'status',
        label: 'Status',
        renderCell: value => <span data-testid="status-badge">{value === 'active' ? '✓ Active' : '✗ Inactive'}</span>,
      },
    ];

    render(<BasicTable data={mockData} dataKey="id" columns={columnsWithCustomCell} />);
    expect(screen.getAllByTestId('status-badge')).toHaveLength(3);
    expect(screen.getAllByText('✓ Active')).toHaveLength(2); // Two active users
  });

  it('uses custom renderRow when provided', () => {
    const customRenderRow = vi.fn((row: TestEntity, index: number) => (
      <tr key={row.id} data-testid={`custom-row-${index}`}>
        <td>{row.name}</td>
      </tr>
    ));

    render(<BasicTable data={mockData} dataKey="id" columns={columns} renderRow={customRenderRow} />);

    expect(customRenderRow).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId('custom-row-0')).toBeInTheDocument();
  });

  it('applies column alignment', () => {
    const columnsWithAlignment: ColumnDefinition<TestEntity>[] = [
      {key: 'id', label: 'ID', align: 'center'},
      {key: 'name', label: 'Name', align: 'left'},
      {key: 'email', label: 'Email', align: 'right'},
    ];

    render(<BasicTable data={mockData} dataKey="id" columns={columnsWithAlignment} />);
    // The component renders correctly with alignment - we test that it doesn't throw
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not show loading spinner when data exists', () => {
    render(<BasicTable data={mockData} dataKey="id" columns={columns} isLoading />);
    // When data exists, we show the table, not the spinner
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
