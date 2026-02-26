import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {AddFab} from './AddFab';

describe('AddFab', () => {
  it('renders with default label "Add"', () => {
    render(<AddFab />);
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('renders with a custom label', () => {
    render(<AddFab label="Create new" />);
    expect(screen.getByText('Create new')).toBeInTheDocument();
  });

  it('renders a button with aria-label "add"', () => {
    render(<AddFab />);
    expect(screen.getByRole('button', {name: /add/i})).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AddFab onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', {name: /add/i}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<AddFab disabled />);
    expect(screen.getByRole('button', {name: /add/i})).toBeDisabled();
  });
});
