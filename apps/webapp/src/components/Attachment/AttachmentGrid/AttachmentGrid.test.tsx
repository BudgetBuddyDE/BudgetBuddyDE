import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {AttachmentGrid} from './AttachmentGrid';

const makeAttachment = (id: string, name: string): TAttachmentWithUrl => ({
  id: id as TAttachmentWithUrl['id'],
  ownerId: 'user-1' as TAttachmentWithUrl['ownerId'],
  fileName: name,
  fileExtension: '.png',
  contentType: 'image/png',
  location: `/uploads/${name}`,
  signedUrl: `https://example.com/signed/${name}`,
  createdAt: '2024-01-15T10:00:00.000Z',
});

describe('AttachmentGrid', () => {
  it('shows an empty message when no attachments are provided', () => {
    render(<AttachmentGrid attachments={[]} />);
    expect(screen.getByText(/no attachments yet/i)).toBeInTheDocument();
  });

  it('renders a card for each attachment', () => {
    const attachments = [
      makeAttachment('00000000-0000-7000-0000-000000000001', 'photo-1.png'),
      makeAttachment('00000000-0000-7000-0000-000000000002', 'photo-2.png'),
    ];
    render(<AttachmentGrid attachments={attachments} />);
    expect(screen.getByText('photo-1.png')).toBeInTheDocument();
    expect(screen.getByText('photo-2.png')).toBeInTheDocument();
  });

  it('passes onView handler to cards', () => {
    const onView = vi.fn();
    const attachments = [makeAttachment('00000000-0000-7000-0000-000000000001', 'photo.png')];
    render(<AttachmentGrid attachments={attachments} onView={onView} />);
    expect(screen.getByRole('button', {name: /view/i})).toBeInTheDocument();
  });
});
