'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {apiClient} from '@/apiClient';
vi.mock('@mui/icons-material', () => ({
  AttachFileRounded: () => null,
}));

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      attachment: {
        deleteById: vi.fn(),
      },
      transaction: {
        getAllTransactionAttachments: vi.fn(),
      },
    },
  },
}));

vi.mock('@/components/Snackbar', () => ({
  useSnackbarContext: () => ({showSnackbar: vi.fn()}),
}));

vi.mock('@/components/Attachments', () => ({
  AttachmentLightbox: () => null,
  AttachmentThumbnail: ({attachment}: {attachment: TAttachmentWithUrl}) => <div>{attachment.fileName}</div>,
}));

vi.mock('@/components/Dialog', () => ({
  DeleteDialog: () => null,
}));

vi.mock('@/components/NoResults', () => ({
  NoResults: () => null,
}));

import {AllAttachmentsClient} from './AllAttachmentsClient';

const makeAttachment = (id: number): TAttachmentWithUrl => ({
  id: `01900000-0000-7000-8000-${String(id).padStart(12, '0')}` as TAttachmentWithUrl['id'],
  ownerId: '01900000-0000-7000-8000-000000000001' as TAttachmentWithUrl['ownerId'],
  fileName: `attachment-${id}.png`,
  fileExtension: 'png',
  contentType: 'image/png',
  location: `attachments/${id}`,
  signedUrl: `https://example.com/attachment-${id}.png`,
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('AllAttachmentsClient', () => {
  it('loads the next server page when Load more is clicked', async () => {
    const initialAttachments = Array.from({length: 20}, (_, index) => makeAttachment(index));
    const nextAttachments = Array.from({length: 5}, (_, index) => makeAttachment(index + 20));
    vi.mocked(apiClient.backend.transaction.getAllTransactionAttachments).mockResolvedValue([
      {data: nextAttachments, totalCount: 25, message: 'ok', status: 200, from: 'db'},
      null,
    ]);

    render(<AllAttachmentsClient initialAttachments={initialAttachments} initialTotalCount={25} />);

    expect(screen.getAllByText(/attachment-\d+\.png/)).toHaveLength(20);
    fireEvent.click(screen.getByRole('button', {name: /load more/i}));

    await waitFor(() => {
      expect(screen.getAllByText(/attachment-\d+\.png/)).toHaveLength(25);
    });
    expect(apiClient.backend.transaction.getAllTransactionAttachments).toHaveBeenCalledWith({from: 20, to: 40});
    expect(screen.queryByRole('button', {name: /load more/i})).not.toBeInTheDocument();
  });
});
