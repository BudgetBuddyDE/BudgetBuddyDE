import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {Attachments} from './attachments';

const api = vi.hoisted(() => ({getAll: vi.fn(), getForTransaction: vi.fn(), upload: vi.fn(), remove: vi.fn()}));
vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      transaction: {
        getAllTransactionAttachments: api.getAll,
        getTransactionAttachments: api.getForTransaction,
        uploadTransactionAttachments: api.upload,
      },
      attachment: {deleteById: api.remove},
    },
  },
}));
vi.mock('@/lib/finance-provider', () => ({
  useFinance: () => ({data: {transactions: [{id: 'tx-1', receiver: 'Market', processedAt: new Date('2026-07-15')}]}}),
}));

describe('Attachments', () => {
  it('loads the signed gallery in chronological batches', async () => {
    api.getAll.mockResolvedValue([
      {
        data: [
          {
            id: 'file-1',
            ownerId: 'user',
            fileName: 'receipt.jpg',
            fileExtension: 'jpg',
            contentType: 'image/jpeg',
            location: 'receipts/file',
            createdAt: '2026-07-15T12:00:00Z',
            signedUrl: 'https://example.com/receipt.jpg',
          },
        ],
        totalCount: 1,
      },
      null,
    ]);
    render(<Attachments />);
    expect(await screen.findByText('receipt.jpg')).toBeVisible();
    expect(screen.getByText(/time-limited signed links/i)).toBeVisible();
    expect(screen.getByRole('button', {name: 'Preview receipt.jpg'})).toBeVisible();
  });

  it('validates upload file types before contacting the API', async () => {
    api.getAll.mockResolvedValue([{data: [], totalCount: 0}, null]);
    api.getForTransaction.mockResolvedValue([{data: [], totalCount: 0}, null]);
    render(<Attachments />);
    await screen.findByText('No receipts uploaded');
    await userEvent.click(screen.getByRole('button', {name: 'Upload files'}));
    await userEvent.selectOptions(screen.getByLabelText('Transaction'), 'tx-1');
    const oversizedImage = new File(['image'], 'receipt.png', {type: 'image/png'});
    Object.defineProperty(oversizedImage, 'size', {value: 11 * 1024 * 1024});
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, oversizedImage);
    expect(await screen.findByRole('alert')).toHaveTextContent(/larger than 10 mb|too large/i);
    expect(api.upload).not.toHaveBeenCalled();
  });
});
