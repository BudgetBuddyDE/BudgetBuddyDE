import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {ConfirmDialog} from './confirm-dialog';

describe('ConfirmDialog', () => {
  it('describes impact and requires an explicit destructive action', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={() => undefined}
        title="Delete transaction?"
        description="This cannot be undone."
        impact="One attachment will also be deleted."
        confirmLabel="Delete transaction"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('One attachment will also be deleted.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Delete transaction'}));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('disables confirmation while pending', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => undefined}
        title="Delete?"
        description="Permanent."
        confirmLabel="Delete"
        pending
        onConfirm={() => undefined}
      />,
    );
    expect(screen.getByRole('button', {name: 'Working…'})).toBeDisabled();
  });
});
