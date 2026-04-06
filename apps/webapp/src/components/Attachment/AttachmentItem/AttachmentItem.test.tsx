import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {AttachmentItem} from './AttachmentItem';

const mockAttachment = {
  id: '019700000000000000000000000000000001' as `${string}&{AttachmentID}`,
  ownerId: 'user-1' as `${string}&{UserID}`,
  fileName: 'receipt.png',
  fileExtension: 'png',
  contentType: 'image/png' as const,
  location: 'user-1/transactions/tx-1/attachment-1.png',
  fileSize: 12345,
  createdAt: '2024-01-15T10:00:00.000Z',
  signedUrl: 'https://example.com/signed/receipt.png',
};

describe('AttachmentItem', () => {
  it('renders the file name', () => {
    render(<AttachmentItem attachment={mockAttachment} />);
    expect(screen.getByText('receipt.png')).toBeInTheDocument();
  });

  it('renders the creation date', () => {
    render(<AttachmentItem attachment={mockAttachment} />);
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('renders file size when provided', () => {
    render(<AttachmentItem attachment={mockAttachment} />);
    expect(screen.getByText(/12\.1 KB/)).toBeInTheDocument();
  });

  it('renders an image preview for image content types', () => {
    render(<AttachmentItem attachment={mockAttachment} />);
    const img = screen.getByRole('img', {name: 'receipt.png'});
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockAttachment.signedUrl);
  });

  it('renders a download button', () => {
    render(<AttachmentItem attachment={mockAttachment} />);
    expect(screen.getByRole('button', {name: /download/i})).toBeInTheDocument();
  });

  it('does not render a delete button when onDelete is not provided', () => {
    render(<AttachmentItem attachment={mockAttachment} />);
    expect(screen.queryByRole('button', {name: /delete/i})).not.toBeInTheDocument();
  });

  it('renders a delete button when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(<AttachmentItem attachment={mockAttachment} onDelete={onDelete} />);
    expect(screen.getByRole('button', {name: /delete/i})).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<AttachmentItem attachment={mockAttachment} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', {name: /delete/i}));
    expect(onDelete).toHaveBeenCalledWith(mockAttachment);
  });

  it('disables the delete button when isDeleting is true', () => {
    render(<AttachmentItem attachment={mockAttachment} onDelete={vi.fn()} isDeleting />);
    expect(screen.getByRole('button', {name: /delete/i})).toBeDisabled();
  });

  it('renders the data-testid attribute', () => {
    render(<AttachmentItem attachment={mockAttachment} />);
    expect(screen.getByTestId('attachment-item')).toBeInTheDocument();
  });
});
