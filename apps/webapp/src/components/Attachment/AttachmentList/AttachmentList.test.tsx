import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {AttachmentList} from './AttachmentList';

const makeAttachment = (overrides: Partial<TAttachmentWithUrl> = {}): TAttachmentWithUrl => ({
  id: '019700000000000000000000000000000001' as `${string}&{AttachmentID}`,
  ownerId: 'user-1' as `${string}&{UserID}`,
  fileName: 'receipt.png',
  fileExtension: 'png',
  contentType: 'image/png' as const,
  location: 'user-1/transactions/tx-1/attachment-1.png',
  fileSize: 10240,
  createdAt: '2024-01-15T10:00:00.000Z',
  signedUrl: 'https://example.com/signed/receipt.png',
  ...overrides,
});

describe('AttachmentList', () => {
  it('renders a loading spinner when isLoading is true', () => {
    render(<AttachmentList attachments={[]} isLoading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders an error message when error is provided', () => {
    const error = new Error('Failed to load attachments');
    render(<AttachmentList attachments={[]} error={error} />);
    expect(screen.getByText('Failed to load attachments')).toBeInTheDocument();
  });

  it('renders the empty message when attachments is empty', () => {
    render(<AttachmentList attachments={[]} emptyMessage="No files yet" />);
    expect(screen.getByText('No files yet')).toBeInTheDocument();
  });

  it('renders the default empty message when not provided', () => {
    render(<AttachmentList attachments={[]} />);
    expect(screen.getByText('No attachments found')).toBeInTheDocument();
  });

  it('renders attachment items for each attachment', () => {
    const attachments = [
      makeAttachment({
        id: '019700000000000000000000000000000001' as `${string}&{AttachmentID}`,
        fileName: 'file1.png',
        signedUrl: 'https://example.com/1',
      }),
      makeAttachment({
        id: '019700000000000000000000000000000002' as `${string}&{AttachmentID}`,
        fileName: 'file2.jpg',
        signedUrl: 'https://example.com/2',
      }),
    ];
    render(<AttachmentList attachments={attachments} />);
    expect(screen.getAllByTestId('attachment-item')).toHaveLength(2);
    expect(screen.getByText('file1.png')).toBeInTheDocument();
    expect(screen.getByText('file2.jpg')).toBeInTheDocument();
  });

  it('passes onDelete to each AttachmentItem', () => {
    const onDelete = vi.fn();
    const attachments = [makeAttachment()];
    render(<AttachmentList attachments={attachments} onDelete={onDelete} />);
    expect(screen.getByRole('button', {name: /delete/i})).toBeInTheDocument();
  });

  it('renders the attachment-list testid', () => {
    render(<AttachmentList attachments={[makeAttachment()]} />);
    expect(screen.getByTestId('attachment-list')).toBeInTheDocument();
  });
});
