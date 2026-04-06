import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {AttachmentUploader} from './AttachmentUploader';

// DocumentScannerDialog opens a full MUI Dialog with react-webcam inside.
// For AttachmentUploader tests we only care that the scan button exists and
// opens the dialog – deeper scanner behaviour is tested in DocumentScannerDialog.test.tsx.
vi.mock('../DocumentScanner', () => ({
  DocumentScannerDialog: ({open}: {open: boolean}) => (open ? <div data-testid="document-scanner-dialog" /> : null),
}));

describe('AttachmentUploader', () => {
  it('renders the drag & drop area', () => {
    render(<AttachmentUploader onUpload={vi.fn()} />);
    expect(screen.getByTestId('attachment-uploader')).toBeInTheDocument();
  });

  it('renders the browse files button', () => {
    render(<AttachmentUploader onUpload={vi.fn()} />);
    expect(screen.getByRole('button', {name: /browse files/i})).toBeInTheDocument();
  });

  it('renders the scan document button', () => {
    render(<AttachmentUploader onUpload={vi.fn()} />);
    expect(screen.getByTestId('scan-document-button')).toBeInTheDocument();
  });

  it('opens the scanner dialog when scan document button is clicked', () => {
    render(<AttachmentUploader onUpload={vi.fn()} />);
    expect(screen.queryByTestId('document-scanner-dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('scan-document-button'));
    expect(screen.getByTestId('document-scanner-dialog')).toBeInTheDocument();
  });

  it('shows a loading indicator when isUploading is true', () => {
    render(<AttachmentUploader onUpload={vi.fn()} isUploading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /browse files/i})).not.toBeInTheDocument();
    expect(screen.queryByTestId('scan-document-button')).not.toBeInTheDocument();
  });

  it('disables the browse button when disabled is true', () => {
    render(<AttachmentUploader onUpload={vi.fn()} disabled />);
    expect(screen.getByRole('button', {name: /browse files/i})).toBeDisabled();
  });

  it('disables the scan button when disabled is true', () => {
    render(<AttachmentUploader onUpload={vi.fn()} disabled />);
    expect(screen.getByTestId('scan-document-button')).toBeDisabled();
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
