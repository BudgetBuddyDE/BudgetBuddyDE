import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {AttachmentCard} from './AttachmentCard';

const baseAttachment: TAttachmentWithUrl = {
  id: '00000000-0000-7000-0000-000000000001' as TAttachmentWithUrl['id'],
  ownerId: 'user-1' as TAttachmentWithUrl['ownerId'],
  fileName: 'test-image.png',
  fileExtension: '.png',
  contentType: 'image/png',
  location: '/uploads/test-image.png',
  signedUrl: 'https://example.com/signed/test-image.png',
  createdAt: '2024-01-15T10:00:00.000Z',
};

describe('AttachmentCard', () => {
  it('renders the file name', () => {
    render(<AttachmentCard attachment={baseAttachment} />);
    expect(screen.getByText('test-image.png')).toBeInTheDocument();
  });

  it('renders an image preview for image content types', () => {
    render(<AttachmentCard attachment={baseAttachment} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/signed/test-image.png');
    expect(img).toHaveAttribute('alt', 'test-image.png');
  });

  it('renders a file icon for non-image content types', () => {
    render(
      <AttachmentCard
        attachment={{...baseAttachment, contentType: 'application/pdf' as TAttachmentWithUrl['contentType']}}
      />,
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows a download button when onDownload is provided', () => {
    const onDownload = vi.fn();
    render(<AttachmentCard attachment={baseAttachment} onDownload={onDownload} />);
    fireEvent.click(screen.getByRole('button', {name: /download/i}));
    expect(onDownload).toHaveBeenCalledWith(baseAttachment);
  });

  it('shows a delete button when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(<AttachmentCard attachment={baseAttachment} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', {name: /delete/i}));
    expect(onDelete).toHaveBeenCalledWith(baseAttachment);
  });

  it('shows a view button when onView is provided and content is an image', () => {
    const onView = vi.fn();
    render(<AttachmentCard attachment={baseAttachment} onView={onView} />);
    fireEvent.click(screen.getByRole('button', {name: /view/i}));
    expect(onView).toHaveBeenCalledWith(baseAttachment);
  });

  it('does not show action buttons when handlers are not provided', () => {
    render(<AttachmentCard attachment={baseAttachment} />);
    expect(screen.queryByRole('button', {name: /download/i})).toBeNull();
    expect(screen.queryByRole('button', {name: /delete/i})).toBeNull();
    expect(screen.queryByRole('button', {name: /view/i})).toBeNull();
  });
});
