import {AddRounded} from '@mui/icons-material';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {TableToolbar} from './TableToolbar';

describe('TableToolbar', () => {
  it('renders title and subtitle', () => {
    render(<TableToolbar title="Test Title" subtitle="Test Subtitle" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders only title when subtitle is not provided', () => {
    render(<TableToolbar title="Only Title" />);
    expect(screen.getByText('Only Title')).toBeInTheDocument();
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
  });

  it('renders search input when showSearch is true', () => {
    const onSearch = vi.fn();
    render(<TableToolbar showSearch onSearch={onSearch} searchPlaceholder="Search items" />);
    expect(screen.getByPlaceholderText('Search items')).toBeInTheDocument();
  });

  it('does not render search when showSearch is false', () => {
    render(<TableToolbar title="Title" />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls onSearch with debounce', async () => {
    const onSearch = vi.fn();
    render(<TableToolbar showSearch onSearch={onSearch} searchDebounceMs={100} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: 'test'}});

    expect(onSearch).not.toHaveBeenCalled();
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('test'), {timeout: 200});
  });

  it('renders action buttons', () => {
    const onClick = vi.fn();
    render(
      <TableToolbar
        actions={[
          {
            id: 'add',
            icon: <AddRounded />,
            label: 'Add item',
            onClick,
          },
        ]}
      />,
    );

    const button = screen.getByRole('button', {name: 'Add item'});
    expect(button).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', () => {
    const onClick = vi.fn();
    render(
      <TableToolbar
        actions={[
          {
            id: 'add',
            icon: <AddRounded />,
            label: 'Add item',
            onClick,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Add item'}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables action button when disabled is true', () => {
    render(
      <TableToolbar
        actions={[
          {
            id: 'add',
            icon: <AddRounded />,
            label: 'Add item',
            onClick: vi.fn(),
            disabled: true,
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', {name: 'Add item'})).toBeDisabled();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<TableToolbar title="Title" isLoading />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    // Skeleton should be rendered instead of actions
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders children in action area', () => {
    render(
      <TableToolbar>
        <button type="button">Custom Action</button>
      </TableToolbar>,
    );
    expect(screen.getByRole('button', {name: 'Custom Action'})).toBeInTheDocument();
  });
});
