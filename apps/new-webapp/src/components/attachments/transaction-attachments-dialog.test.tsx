import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TransactionAttachmentsDialog} from './transaction-attachments-dialog';

const mocks = vi.hoisted(() => ({load: vi.fn(), upload: vi.fn(), remove: vi.fn()}));
vi.mock('@/lib/attachment-mutations', () => ({
  loadTransactionAttachments: mocks.load,
  uploadTransactionAttachments: mocks.upload,
  deleteTransactionAttachment: mocks.remove,
}));
const transaction = {id: 'tx', receiver: 'Market'} as never;
const attachment = {id: 'a', fileName: 'receipt.png', signedUrl: 'https://files.example/receipt.png'} as never;

describe('TransactionAttachmentsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.load.mockResolvedValue({attachments: [attachment]});
  });
  it('loads expiring previews and confirms deletion', async () => {
    mocks.remove.mockResolvedValue(true);
    render(<TransactionAttachmentsDialog transaction={transaction} onOpenChange={() => undefined} />);
    expect(await screen.findByAltText('receipt.png')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Open receipt.png'})).toHaveAttribute('rel', 'noreferrer');
    fireEvent.click(screen.getByRole('button', {name: 'Delete receipt.png'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Delete attachment'}));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('tx', 'a'));
  });
  it('uploads selected files and reports service validation errors', async () => {
    mocks.upload.mockResolvedValue({attachments: [], error: 'Only images.'});
    render(<TransactionAttachmentsDialog transaction={transaction} onOpenChange={() => undefined} />);
    await screen.findByAltText('receipt.png');
    const file = new File(['bad'], 'bad.txt', {type: 'text/plain'});
    fireEvent.change(screen.getByLabelText('Add receipt images'), {target: {files: [file]}});
    fireEvent.click(screen.getByRole('button', {name: 'Upload 1'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Only images');
  });
});
