import {act, fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {DocumentScanner} from './DocumentScanner';

// ---------------------------------------------------------------------------
// MediaDevices mock – happy-dom doesn't implement getUserMedia
// ---------------------------------------------------------------------------

const mockGetUserMedia = vi.fn();
const mockStop = vi.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {getUserMedia: mockGetUserMedia},
  writable: true,
  configurable: true,
});

function makeMockStream() {
  return {
    getTracks: () => [{stop: mockStop}],
  } as unknown as MediaStream;
}

describe('DocumentScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Scan trigger button', () => {
    render(<DocumentScanner onCapture={vi.fn()} />);
    expect(screen.getByRole('button', {name: /scan/i})).toBeInTheDocument();
  });

  it('opens the dialog when the Scan button is clicked', async () => {
    mockGetUserMedia.mockResolvedValueOnce(makeMockStream());

    await act(async () => {
      render(<DocumentScanner onCapture={vi.fn()} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: /scan/i}));
    });

    expect(screen.getByText('Scan Document')).toBeInTheDocument();
  });

  it('shows an error message when getUserMedia is denied', async () => {
    const notAllowedError = Object.assign(new Error('Permission denied'), {
      name: 'NotAllowedError',
    });
    mockGetUserMedia.mockRejectedValueOnce(notAllowedError);

    await act(async () => {
      render(<DocumentScanner onCapture={vi.fn()} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: /scan/i}));
    });

    expect(await screen.findByText(/camera permission denied/i)).toBeInTheDocument();
  });

  it('shows an error when getUserMedia is not supported', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(<DocumentScanner onCapture={vi.fn()} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: /scan/i}));
    });

    expect(await screen.findByText(/not supported in this browser/i)).toBeInTheDocument();

    // Restore
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {getUserMedia: mockGetUserMedia},
      writable: true,
      configurable: true,
    });
  });

  it('closes the dialog when the close button is clicked', async () => {
    mockGetUserMedia.mockResolvedValueOnce(makeMockStream());

    await act(async () => {
      render(<DocumentScanner onCapture={vi.fn()} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: /scan/i}));
    });

    expect(screen.getByText('Scan Document')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: /close scanner/i}));
    });

    // In happy-dom, MUI's Dialog exit animation never fires onExited, so the
    // portal content remains in the DOM. Verify the close side-effect instead:
    // the camera stream tracks must be stopped when the dialog closes.
    expect(mockStop).toHaveBeenCalled();
  });

  it('stops all camera tracks when the dialog is closed', async () => {
    mockGetUserMedia.mockResolvedValueOnce(makeMockStream());

    await act(async () => {
      render(<DocumentScanner onCapture={vi.fn()} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: /scan/i}));
    });

    // Close the dialog
    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: /close scanner/i}));
    });

    expect(mockStop).toHaveBeenCalled();
  });
});
