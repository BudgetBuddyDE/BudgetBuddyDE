'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@mui/icons-material', () => ({
  AttachFileRounded: () => null,
}));

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      attachment: {
        deleteById: vi.fn(),
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
  it('loads every batch when Load more is clicked repeatedly', () => {
    const attachments = Array.from({length: 61}, (_, index) => makeAttachment(index));
    render(<AllAttachmentsClient initialAttachments={attachments} />);

    const loadMore = () => fireEvent.click(screen.getByRole('button', {name: /load more/i}));

    expect(screen.getAllByText(/attachment-\d+\.png/)).toHaveLength(20);
    loadMore();
    expect(screen.getAllByText(/attachment-\d+\.png/)).toHaveLength(40);
    loadMore();
    expect(screen.getAllByText(/attachment-\d+\.png/)).toHaveLength(60);
    loadMore();
    expect(screen.getAllByText(/attachment-\d+\.png/)).toHaveLength(61);
    expect(screen.queryByRole('button', {name: /load more/i})).not.toBeInTheDocument();
  });
});
