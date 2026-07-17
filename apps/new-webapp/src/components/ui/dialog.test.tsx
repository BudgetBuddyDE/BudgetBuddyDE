import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {DialogShell} from './dialog';

describe('DialogShell', () => {
  it('renders accessible content and closes through its control', async () => {
    const onOpenChange = vi.fn();
    render(
      <DialogShell open onOpenChange={onOpenChange} title="Edit transaction" description="Update the selected item">
        <label htmlFor="receiver">Receiver</label>
        <input id="receiver" />
      </DialogShell>,
    );

    expect(screen.getByRole('dialog', {name: 'Edit transaction'})).toBeInTheDocument();
    expect(screen.getByText('Update the selected item')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Close dialog'}));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything()));
  });
});
