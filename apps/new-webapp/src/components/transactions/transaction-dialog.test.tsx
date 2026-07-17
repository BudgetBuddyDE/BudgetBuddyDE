import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TransactionDialog} from './transaction-dialog';

const mocks = vi.hoisted(() => ({saveTransactions: vi.fn()}));
vi.mock('@/lib/transaction-mutations', () => ({saveTransactions: mocks.saveTransactions}));

const baseProps = {open: true, onOpenChange: vi.fn(), categories: [], paymentMethods: [], onSaved: vi.fn()};

describe('TransactionDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows field validation without closing', async () => {
    mocks.saveTransactions.mockResolvedValue({saved: 0, failed: 1, validationErrors: {0: {amount: 'Invalid amount'}}});
    render(<TransactionDialog {...baseProps} />);
    fireEvent.click(screen.getByRole('button', {name: 'Save transaction'}));
    expect(await screen.findByText('Invalid amount')).toBeInTheDocument();
    expect(baseProps.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('closes and refreshes the owner after a successful save', async () => {
    mocks.saveTransactions.mockResolvedValue({saved: 1, failed: 0, validationErrors: {}});
    render(<TransactionDialog {...baseProps} />);
    fireEvent.click(screen.getByRole('button', {name: 'Save transaction'}));
    await waitFor(() => expect(baseProps.onOpenChange).toHaveBeenCalledWith(false));
    expect(baseProps.onSaved).toHaveBeenCalled();
  });

  it('keeps service failures visible and actionable', async () => {
    mocks.saveTransactions.mockResolvedValue({saved: 0, failed: 1, validationErrors: {}});
    render(<TransactionDialog {...baseProps} />);
    fireEvent.click(screen.getByRole('button', {name: 'Save transaction'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be created');
  });
});
