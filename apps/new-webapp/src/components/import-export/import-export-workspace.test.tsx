import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ImportExportWorkspace} from './import-export-workspace';
const mocks = vi.hoisted(() => ({save: vi.fn()}));
vi.mock('@/lib/transaction-mutations', () => ({saveTransactions: mocks.save}));
const categories = [{id: 'c', name: 'Food'}] as never;
const paymentMethods = [{id: 'p', name: 'Card'}] as never;

describe('ImportExportWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());
  it('maps, previews, and imports valid rows while skipping invalid rows', async () => {
    mocks.save.mockResolvedValue({saved: 1, failed: 0, validationErrors: {}});
    render(<ImportExportWorkspace categories={categories} paymentMethods={paymentMethods} />);
    const file = new File([''], 'transactions.csv', {type: 'text/csv'});
    Object.defineProperty(file, 'text', {
      value: async () => 'date,amount,receiver\n2026-07-01,-10.00,Market\nbad,nope,',
    });
    fireEvent.change(screen.getByLabelText('CSV file'), {target: {files: [file]}});
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Import category'), {target: {value: 'c'}});
    fireEvent.change(screen.getByLabelText('Import payment method'), {target: {value: 'p'}});
    expect(screen.getByText(/1 valid of 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Import 1 valid rows'}));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        [expect.objectContaining({receiver: 'Market', amount: '10.00', type: 'expense'})],
        categories,
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('1 imported · 1 failed or skipped');
  });
  it('exposes a private JSON archive action', () => {
    render(<ImportExportWorkspace categories={categories} paymentMethods={paymentMethods} />);
    expect(screen.getByRole('link', {name: /Download JSON/})).toHaveAttribute('href', '/api/export/user-data');
  });
});
