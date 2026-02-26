import {act, fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {DeleteDialog} from './DeleteDialog';

describe('DeleteDialog', () => {
  it('renders the dialog when open is true', async () => {
    await act(async () => {
      render(<DeleteDialog open={true} onCancel={vi.fn()} onConfirm={vi.fn()} onClose={vi.fn()} />);
    });
    expect(screen.getByText('Attention')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete these entries?')).toBeInTheDocument();
  });

  it('does not render dialog content when open is false', async () => {
    await act(async () => {
      render(<DeleteDialog open={false} onCancel={vi.fn()} onConfirm={vi.fn()} onClose={vi.fn()} />);
    });
    expect(screen.queryByText('Attention')).not.toBeInTheDocument();
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    await act(async () => {
      render(<DeleteDialog open={true} onCancel={onCancel} onConfirm={vi.fn()} onClose={vi.fn()} />);
    });
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    await act(async () => {
      render(<DeleteDialog open={true} onCancel={vi.fn()} onConfirm={onConfirm} onClose={vi.fn()} />);
    });
    fireEvent.click(screen.getByRole('button', {name: 'Yes, delete'}));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders custom title and content text', async () => {
    await act(async () => {
      render(
        <DeleteDialog
          open={true}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
          onClose={vi.fn()}
          text={{title: 'Custom title', content: 'Custom content'}}
        />,
      );
    });
    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('renders with transition when withTransition is true', async () => {
    await act(async () => {
      render(<DeleteDialog open={true} onCancel={vi.fn()} onConfirm={vi.fn()} onClose={vi.fn()} withTransition />);
    });
    expect(screen.getByText('Attention')).toBeInTheDocument();
  });
});
