import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      transaction: {
        getTransactionAttachments: vi.fn(),
        uploadTransactionAttachments: vi.fn(),
        deleteTransactionAttachments: vi.fn(),
      },
    },
  },
}));

vi.mock('@/components/Snackbar', () => {
  const showSnackbar = vi.fn();
  return {
    useSnackbarContext: () => ({showSnackbar}),
  };
});

import {apiClient} from '@/apiClient';
import {TransactionAttachments} from './TransactionAttachments';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TX_ID = '01900000-0000-7000-8000-000000000001' as Parameters<typeof TransactionAttachments>[0]['transactionId'];

function makeAttachment(id: string): TAttachmentWithUrl {
  return {
    id: `01900000-0000-7000-8000-000000000${id}` as TAttachmentWithUrl['id'],
    ownerId: 'user-1' as TAttachmentWithUrl['ownerId'],
    fileName: `file-${id}.png`,
    fileExtension: 'png',
    contentType: 'image/png' as const,
    location: `path/${id}.png`,
    signedUrl: `https://example.com/${id}.png`,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransactionAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upload zone', async () => {
    vi.mocked(apiClient.backend.transaction.getTransactionAttachments).mockResolvedValue([
      {data: [], message: 'ok', status: 200, from: 'db'},
      null,
    ]);

    await act(async () => {
      render(<TransactionAttachments transactionId={TX_ID} />);
    });

    expect(screen.getByText(/click or drag/i)).toBeInTheDocument();
  });

  it('shows "No attachments yet" when there are no attachments', async () => {
    vi.mocked(apiClient.backend.transaction.getTransactionAttachments).mockResolvedValue([
      {data: [], message: 'ok', status: 200, from: 'db'},
      null,
    ]);

    await act(async () => {
      render(<TransactionAttachments transactionId={TX_ID} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/no attachments yet/i)).toBeInTheDocument();
    });
  });

  it('renders attachment thumbnails when attachments exist', async () => {
    const attachments = [makeAttachment('att-1'), makeAttachment('att-2')];
    vi.mocked(apiClient.backend.transaction.getTransactionAttachments).mockResolvedValue([
      {data: attachments, message: 'ok', status: 200, from: 'db'},
      null,
    ]);

    await act(async () => {
      render(<TransactionAttachments transactionId={TX_ID} />);
    });

    await waitFor(() => {
      expect(screen.getByText('file-att-1.png')).toBeInTheDocument();
      expect(screen.getByText('file-att-2.png')).toBeInTheDocument();
    });
  });

  it('opens the lightbox when View is clicked', async () => {
    const attachment = makeAttachment('att-view');
    vi.mocked(apiClient.backend.transaction.getTransactionAttachments).mockResolvedValue([
      {data: [attachment], message: 'ok', status: 200, from: 'db'},
      null,
    ]);

    await act(async () => {
      render(<TransactionAttachments transactionId={TX_ID} />);
    });

    await waitFor(() => screen.getByText('file-att-view.png'));

    // MUI Tooltip adds aria-label to the wrapped button element
    const viewButtons = screen.getAllByRole('button', {name: /^View$/i});
    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });

    // The lightbox dialog should be open and show the filename
    expect(screen.getAllByText('file-att-view.png').length).toBeGreaterThanOrEqual(2);
  });

  it('opens delete confirmation when Delete is clicked', async () => {
    const attachment = makeAttachment('att-del');
    vi.mocked(apiClient.backend.transaction.getTransactionAttachments).mockResolvedValue([
      {data: [attachment], message: 'ok', status: 200, from: 'db'},
      null,
    ]);

    await act(async () => {
      render(<TransactionAttachments transactionId={TX_ID} />);
    });

    await waitFor(() => screen.getByText('file-att-del.png'));

    const deleteButtons = screen.getAllByRole('button', {name: /^Delete$/i});
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    expect(screen.getByText(/are you sure you want to delete this attachment/i)).toBeInTheDocument();
  });

  it('calls deleteTransactionAttachments when delete is confirmed', async () => {
    const attachment = makeAttachment('att-confirm');
    vi.mocked(apiClient.backend.transaction.getTransactionAttachments).mockResolvedValue([
      {data: [attachment], message: 'ok', status: 200, from: 'db'},
      null,
    ]);
    vi.mocked(apiClient.backend.transaction.deleteTransactionAttachments).mockResolvedValueOnce([
      {data: null, message: 'deleted', status: 200, from: 'db'},
      null,
    ]);

    await act(async () => {
      render(<TransactionAttachments transactionId={TX_ID} />);
    });
    await waitFor(() => screen.getByText('file-att-confirm.png'));

    // Open delete dialog
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', {name: /^Delete$/i})[0]);
    });

    // Confirm deletion
    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: /yes, delete/i}));
    });

    expect(apiClient.backend.transaction.deleteTransactionAttachments).toHaveBeenCalledWith(TX_ID, {
      attachmentIds: [attachment.id],
    });
  });

  it('renders the file input with correct accept attribute', async () => {
    vi.mocked(apiClient.backend.transaction.getTransactionAttachments).mockResolvedValue([
      {data: [], message: 'ok', status: 200, from: 'db'},
      null,
    ]);

    await act(async () => {
      render(<TransactionAttachments transactionId={TX_ID} />);
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.accept).toBe('image/png,image/jpg,image/jpeg,image/webp');
    expect(input.multiple).toBe(true);
  });

  it('calls uploadTransactionAttachments when a file is selected', async () => {
    vi.mocked(apiClient.backend.transaction.getTransactionAttachments).mockResolvedValue([
      {data: [], message: 'ok', status: 200, from: 'db'},
      null,
    ]);
    vi.mocked(apiClient.backend.transaction.uploadTransactionAttachments).mockResolvedValueOnce([
      {data: [], message: 'uploaded', status: 201, from: 'db'},
      null,
    ]);

    await act(async () => {
      render(<TransactionAttachments transactionId={TX_ID} />);
    });

    const file = new File(['content'], 'receipt.png', {type: 'image/png'});
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, {target: {files: [file]}});
    });

    expect(apiClient.backend.transaction.uploadTransactionAttachments).toHaveBeenCalledWith(TX_ID, [file]);
  });
});
