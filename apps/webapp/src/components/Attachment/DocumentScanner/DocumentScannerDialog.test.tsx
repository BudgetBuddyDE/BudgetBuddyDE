import {fireEvent, render, screen} from '@testing-library/react';
import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {DocumentScannerDialog} from './DocumentScannerDialog';

// ── Mocks ────────────────────────────────────────────────────────────────────

// react-webcam renders a <video> element which is not supported in happy-dom.
// We replace it with a forwardRef stub that exposes `getScreenshot` via the ref
// (matching the real Webcam component's imperative API).
vi.mock('react-webcam', () => ({
  default: React.forwardRef((_props: Record<string, unknown>, ref: React.Ref<{getScreenshot: () => string}>) => {
    React.useImperativeHandle(ref, () => ({
      getScreenshot: () =>
        // Minimal valid JPEG data URL (1×1 white pixel)
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=',
    }));
    // biome-ignore lint/a11y/useMediaCaption: test stub – no real audio stream
    return <video data-testid="webcam-preview" />;
  }),
}));

// Stub the global Image constructor so that `img.onload` fires synchronously
// for data URLs (happy-dom doesn't fire it automatically).
vi.stubGlobal(
  'Image',
  class {
    width = 200;
    height = 150;
    onload: (() => void) | null = null;
    private _src = '';

    set src(value: string) {
      this._src = value;
      if (this.onload) this.onload();
    }
    get src() {
      return this._src;
    }
  },
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DocumentScannerDialog', () => {
  it('renders nothing when closed', () => {
    render(<DocumentScannerDialog open={false} onCapture={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTestId('document-scanner-dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog with "Scan Document" title when open', () => {
    render(<DocumentScannerDialog open={true} onCapture={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Scan Document')).toBeInTheDocument();
  });

  it('shows the webcam preview in the camera phase', () => {
    render(<DocumentScannerDialog open={true} onCapture={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('webcam-preview')).toBeInTheDocument();
  });

  it('shows "Capture" and "Cancel" buttons in the camera phase', () => {
    render(<DocumentScannerDialog open={true} onCapture={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('capture-button')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /cancel/i})).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<DocumentScannerDialog open={true} onCapture={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', {name: /cancel/i}));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the close icon is clicked', () => {
    const onClose = vi.fn();
    render(<DocumentScannerDialog open={true} onCapture={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', {name: /close/i}));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('transitions to the crop phase after Capture and shows the crop canvas', async () => {
    render(<DocumentScannerDialog open={true} onCapture={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('capture-button'));
    // The Image stub fires onload synchronously, so the phase change is immediate.
    expect(await screen.findByText('Adjust Corners')).toBeInTheDocument();
    expect(screen.getByTestId('crop-canvas')).toBeInTheDocument();
  });

  it('shows "Scan" and "Retake" buttons in the crop phase', async () => {
    render(<DocumentScannerDialog open={true} onCapture={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('capture-button'));
    await screen.findByText('Adjust Corners');
    expect(screen.getByTestId('scan-button')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /retake/i})).toBeInTheDocument();
  });

  it('goes back to the camera phase when "Retake" is clicked in crop phase', async () => {
    render(<DocumentScannerDialog open={true} onCapture={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('capture-button'));
    await screen.findByText('Adjust Corners');
    fireEvent.click(screen.getByRole('button', {name: /retake/i}));
    expect(screen.getByText('Scan Document')).toBeInTheDocument();
  });
});
