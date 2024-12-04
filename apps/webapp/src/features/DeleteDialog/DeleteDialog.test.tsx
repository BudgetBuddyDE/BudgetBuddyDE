import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {DeleteDialog} from './DeleteDialog.component';

describe('DeleteDialog', () => {
  it('renders the dialog when open is true', () => {
    render(<DeleteDialog open={true} onCancel={vi.fn()} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Attention')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete these entries?')).toBeInTheDocument();
  });

  it('does not render the dialog when open is false', () => {
    render(<DeleteDialog open={false} onCancel={vi.fn()} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText('Attention')).not.toBeInTheDocument();
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<DeleteDialog open={true} onCancel={onCancel} onConfirm={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<DeleteDialog open={true} onCancel={vi.fn()} onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Yes, delete'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders with transition when withTransition is true', () => {
    render(<DeleteDialog open={true} onCancel={vi.fn()} onConfirm={vi.fn()} onClose={vi.fn()} withTransition={true} />);
    expect(screen.getByText('Attention')).toBeInTheDocument();
  });
});
