import {act, fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {Menu} from './Menu';

const actions = [
  {children: 'Edit', onClick: vi.fn()},
  {children: 'Delete', onClick: vi.fn()},
];

describe('Menu (icon button mode)', () => {
  it('renders an icon button when useIconButton is true', () => {
    render(<Menu useIconButton actions={actions} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens the menu when the icon button is clicked', async () => {
    render(<Menu useIconButton actions={actions} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls the action onClick when a menu item is clicked', async () => {
    const onEdit = vi.fn();
    render(<Menu useIconButton actions={[{children: 'Edit', onClick: onEdit}]} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});

describe('Menu (button mode)', () => {
  it('renders a button with default label "Menu" when no buttonProps are provided', () => {
    render(<Menu actions={actions} />);
    expect(screen.getByRole('button', {name: 'Menu'})).toBeInTheDocument();
  });

  it('renders a button with a custom label', () => {
    render(<Menu actions={actions} buttonProps={{children: 'Options'}} />);
    expect(screen.getByRole('button', {name: 'Options'})).toBeInTheDocument();
  });

  it('opens the menu when the button is clicked', async () => {
    render(<Menu actions={actions} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Menu'}));
    });
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });
});
