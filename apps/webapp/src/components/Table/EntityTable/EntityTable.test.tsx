import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {ColumnDefinition} from '../BasicTable';
import type {EntitySlice} from './EntityTable';
import {EntityTable} from './EntityTable';

type User = {
  id: number;
  name: string;
  email: string;
};

const mockColumns: ColumnDefinition<User>[] = [
  {key: 'id', label: 'ID'},
  {key: 'name', label: 'Name'},
  {key: 'email', label: 'Email'},
];

const mockUsers: User[] = [
  {id: 1, name: 'Alice', email: 'alice@test.com'},
  {id: 2, name: 'Bob', email: 'bob@test.com'},
  {id: 3, name: 'Charlie', email: 'charlie@test.com'},
];

describe('EntityTable', () => {
  it('renders data from slice', () => {
    const slice: EntitySlice<User> = {
      data: mockUsers,
      isLoading: false,
      error: null,
    };

    render(<EntityTable slice={slice} dataKey="id" columns={mockColumns} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
  });

  it('shows loading state from slice', () => {
    const slice: EntitySlice<User> = {
      data: [],
      isLoading: true,
      error: null,
    };

    render(<EntityTable slice={slice} dataKey="id" columns={mockColumns} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state from slice', () => {
    const slice: EntitySlice<User> = {
      data: [],
      isLoading: false,
      error: 'Failed to fetch users',
    };

    render(<EntityTable slice={slice} dataKey="id" columns={mockColumns} />);
    expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    const slice: EntitySlice<User> = {
      data: [],
      isLoading: false,
      error: null,
    };

    render(<EntityTable slice={slice} dataKey="id" columns={mockColumns} emptyMessage="No users available" />);
    expect(screen.getByText('No users available')).toBeInTheDocument();
  });

  it('shows count in toolbar title when showCount is true', () => {
    const slice: EntitySlice<User> = {
      data: mockUsers,
      isLoading: false,
      error: null,
      totalCount: 100,
    };

    render(
      <EntityTable slice={slice} dataKey="id" columns={mockColumns} toolbar={{title: 'Users', showCount: true}} />,
    );

    expect(screen.getByText('Users (100)')).toBeInTheDocument();
  });

  it('uses data length when totalCount is not provided', () => {
    const slice: EntitySlice<User> = {
      data: mockUsers,
      isLoading: false,
      error: null,
    };

    render(
      <EntityTable slice={slice} dataKey="id" columns={mockColumns} toolbar={{title: 'Users', showCount: true}} />,
    );

    expect(screen.getByText('Users (3)')).toBeInTheDocument();
  });

  it('renders pagination when provided', () => {
    const slice: EntitySlice<User> = {
      data: mockUsers,
      isLoading: false,
      error: null,
    };

    const onPageChange = vi.fn();
    const onRowsPerPageChange = vi.fn();

    render(
      <EntityTable
        slice={slice}
        dataKey="id"
        columns={mockColumns}
        pagination={{
          page: 0,
          rowsPerPage: 10,
          onPageChange,
          onRowsPerPageChange,
        }}
      />,
    );

    expect(screen.getByText('Rows:')).toBeInTheDocument();
  });

  it('calls pagination handlers', () => {
    const slice: EntitySlice<User> = {
      data: mockUsers,
      isLoading: false,
      error: null,
      totalCount: 50,
    };

    const onPageChange = vi.fn();
    const onRowsPerPageChange = vi.fn();

    render(
      <EntityTable
        slice={slice}
        dataKey="id"
        columns={mockColumns}
        pagination={{
          page: 0,
          rowsPerPage: 10,
          onPageChange,
          onRowsPerPageChange,
        }}
      />,
    );

    // Find and click next page button
    const nextButton = screen.getByRole('button', {name: /next/i});
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onRowClick when row is clicked', () => {
    const slice: EntitySlice<User> = {
      data: mockUsers,
      isLoading: false,
      error: null,
    };

    const onRowClick = vi.fn();
    render(<EntityTable slice={slice} dataKey="id" columns={mockColumns} onRowClick={onRowClick} />);

    fireEvent.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(mockUsers[0], 0);
  });

  it('renders with custom renderCell', () => {
    const slice: EntitySlice<User> = {
      data: mockUsers,
      isLoading: false,
      error: null,
    };

    const columnsWithCustom: ColumnDefinition<User>[] = [
      ...mockColumns.slice(0, 2),
      {
        key: 'email',
        label: 'Email',
        renderCell: value => <a href={`mailto:${value}`}>{String(value)}</a>,
      },
    ];

    render(<EntityTable slice={slice} dataKey="id" columns={columnsWithCustom} />);
    expect(screen.getByRole('link', {name: 'alice@test.com'})).toHaveAttribute('href', 'mailto:alice@test.com');
  });
});
