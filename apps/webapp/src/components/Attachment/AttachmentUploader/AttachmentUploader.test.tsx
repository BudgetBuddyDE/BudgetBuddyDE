import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {AttachmentUploader} from './AttachmentUploader';

describe('AttachmentUploader', () => {
  it('renders the drag & drop area', () => {
    render(<AttachmentUploader onUpload={vi.fn()} />);
    expect(screen.getByTestId('attachment-uploader')).toBeInTheDocument();
  });

  it('renders the browse files button', () => {
    render(<AttachmentUploader onUpload={vi.fn()} />);
    expect(screen.getByRole('button', {name: /browse files/i})).toBeInTheDocument();
  });

  it('shows a loading indicator when isUploading is true', () => {
    render(<AttachmentUploader onUpload={vi.fn()} isUploading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /browse files/i})).not.toBeInTheDocument();
  });

  it('disables the browse button when disabled is true', () => {
    render(<AttachmentUploader onUpload={vi.fn()} disabled />);
    expect(screen.getByRole('button', {name: /browse files/i})).toBeDisabled();
  });

  it('calls onUpload with selected files', () => {
    const onUpload = vi.fn();
    render(<AttachmentUploader onUpload={onUpload} />);
    const input = screen.getByTestId('attachment-file-input');
    const file = new File(['content'], 'photo.png', {type: 'image/png'});
    fireEvent.change(input, {target: {files: [file]}});
    expect(onUpload).toHaveBeenCalledWith([file]);
  });

  it('respects the maxFiles limit', () => {
    const onUpload = vi.fn();
    render(<AttachmentUploader onUpload={onUpload} maxFiles={1} />);
    const input = screen.getByTestId('attachment-file-input');
    const files = [new File(['a'], 'a.png', {type: 'image/png'}), new File(['b'], 'b.png', {type: 'image/png'})];
    fireEvent.change(input, {target: {files}});
    expect(onUpload).toHaveBeenCalledWith([files[0]]);
  });

  it('shows supported format text', () => {
    render(<AttachmentUploader onUpload={vi.fn()} />);
    expect(screen.getByText(/PNG, JPG, JPEG, WebP/i)).toBeInTheDocument();
  });
});
