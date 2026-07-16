import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {I18nProvider} from '@/lib/i18n';
import {TransactionAttachments} from './transaction-attachments';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  reload: vi.fn(),
}));
vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      transaction: {getTransactionAttachments: api.list, uploadTransactionAttachments: api.upload},
      attachment: {deleteById: api.remove},
    },
  },
}));
vi.mock('@/lib/finance-provider', () => ({useFinance: () => ({reload: api.reload})}));

function renderAttachments() {
  return render(
    <I18nProvider>
      <TransactionAttachments transactionId="tx-1" />
    </I18nProvider>,
  );
}

describe('TransactionAttachments', () => {
  it('validates dropped files before making an upload request', async () => {
    api.list.mockResolvedValue([{data: [], totalCount: 0}, null]);
    renderAttachments();
    await screen.findByText('No attachments');
    const invalid = new File(['content'], 'receipt.txt', {type: 'text/plain'});
    fireEvent.drop(screen.getByRole('button', {name: 'Add attachment files'}), {dataTransfer: {files: [invalid]}});
    expect(screen.getByText('Unsupported file type.')).toBeVisible();
    expect(screen.getByRole('button', {name: /upload 0 files/i})).toBeDisabled();
    expect(api.upload).not.toHaveBeenCalled();
  });

  it('shows real per-file upload progress and refreshes the signed attachment list', async () => {
    const uploadResult = Promise.withResolvers<unknown>();
    api.list.mockResolvedValueOnce([{data: [], totalCount: 0}, null]).mockResolvedValueOnce([
      {
        data: [
          {
            id: 'a1',
            fileName: 'receipt.png',
            signedUrl: 'https://example.test/signed',
            createdAt: new Date('2026-07-16'),
          },
        ],
        totalCount: 1,
      },
      null,
    ]);
    api.upload.mockReturnValue(uploadResult.promise);
    api.reload.mockResolvedValue(undefined);
    renderAttachments();
    await screen.findByText('No attachments');

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['image'], 'receipt.png', {type: 'image/png'});
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', {name: 'Upload 1 file'}));
    expect(await screen.findByRole('progressbar', {name: 'Uploading receipt.png'})).toBeVisible();
    uploadResult.resolve([{}, null]);

    expect(await screen.findByText('Uploaded')).toBeVisible();
    await waitFor(() => expect(api.upload).toHaveBeenCalledWith('tx-1', [file]));
    expect(await screen.findByRole('button', {name: 'Preview receipt.png'})).toBeVisible();
    expect(api.reload).toHaveBeenCalledWith(true);
  });
});
