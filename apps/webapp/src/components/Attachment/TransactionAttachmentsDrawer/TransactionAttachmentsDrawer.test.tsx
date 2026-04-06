import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {TransactionAttachmentsDrawer} from './TransactionAttachmentsDrawer';

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      transaction: {
        getTransactionAttachments: vi.fn().mockResolvedValue([{data: [], status: 200}, null]),
        uploadTransactionAttachments: vi.fn().mockResolvedValue([{data: [], status: 201}, null]),
        deleteTransactionAttachments: vi.fn().mockResolvedValue([{data: null, status: 200}, null]),
      },
    },
  },
}));

vi.mock('@/components/Snackbar', () => ({
  useSnackbarContext: () => ({showSnackbar: vi.fn()}),
}));

const mockTransaction = {
  id: 'tx-id-1' as `${string}&{TransactionID}`,
  receiver: 'Amazon',
  processedAt: new Date('2024-01-15'),
};

describe('TransactionAttachmentsDrawer', () => {
  it('renders without crashing when closed', () => {
    const {container} = render(<TransactionAttachmentsDrawer open={false} transaction={null} onClose={vi.fn()} />);
    expect(container).toBeDefined();
  });

  it('renders the Attachments header when open', () => {
    render(<TransactionAttachmentsDrawer open={true} transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByText('Attachments')).toBeInTheDocument();
  });

  it('renders the transaction receiver name', () => {
    render(<TransactionAttachmentsDrawer open={true} transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByText('Amazon')).toBeInTheDocument();
  });

  it('renders the uploader area', () => {
    render(<TransactionAttachmentsDrawer open={true} transaction={mockTransaction} onClose={vi.fn()} />);
    expect(screen.getByTestId('attachment-uploader')).toBeInTheDocument();
  });
});
