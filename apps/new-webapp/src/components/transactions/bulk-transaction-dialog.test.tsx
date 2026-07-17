import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BulkTransactionDialog} from './bulk-transaction-dialog';

const mocks = vi.hoisted(() => ({desktop: true, saveTransactions: vi.fn()}));
vi.mock('@/hooks/use-desktop-feature', () => ({useDesktopFeature: () => mocks.desktop}));
vi.mock('@/lib/transaction-mutations', () => ({saveTransactions: mocks.saveTransactions}));

const props = {mode: 'create' as const, categories: [], paymentMethods: [], onSaved: vi.fn()};

describe('BulkTransactionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.desktop = true;
  });

  it('is completely absent on unsupported smaller viewports', () => {
    mocks.desktop = false;
    render(<BulkTransactionDialog {...props} />);
    expect(screen.queryByRole('button', {name: 'Add multiple'})).not.toBeInTheDocument();
  });

  it('creates multiple editable rows in one desktop dialog', async () => {
    render(<BulkTransactionDialog {...props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Add multiple'}));
    expect(await screen.findByRole('dialog', {name: 'Add multiple transactions'})).toBeInTheDocument();
    expect(screen.getAllByText(/Transaction \d/)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', {name: 'Add another row'}));
    expect(screen.getAllByText(/Transaction \d/)).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', {name: 'Remove transaction 2'}));
    expect(screen.getAllByText(/Transaction \d/)).toHaveLength(2);
  });

  it('submits all rows once and closes only when all succeed', async () => {
    mocks.saveTransactions.mockResolvedValue({saved: 2, failed: 0, validationErrors: {}});
    render(<BulkTransactionDialog {...props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Add multiple'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Save 2 transactions'}));
    await waitFor(() => expect(mocks.saveTransactions).toHaveBeenCalledWith(expect.any(Array), []));
    expect(props.onSaved).toHaveBeenCalled();
  });

  it('reports partial failures without hiding the result', async () => {
    mocks.saveTransactions.mockResolvedValue({saved: 1, failed: 1, validationErrors: {}});
    render(<BulkTransactionDialog {...props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Add multiple'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Save 2 transactions'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('1 saved; 1 failed');
  });
});
