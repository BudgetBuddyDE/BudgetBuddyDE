import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AttachmentWorkspace} from './attachment-workspace';
const mocks = vi.hoisted(() => ({push: vi.fn(), refresh: vi.fn(), remove: vi.fn()}));
vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push, refresh: mocks.refresh})}));
vi.mock('@/lib/attachment-mutations', () => ({deleteAttachment: mocks.remove}));
const attachment = {
  id: 'a',
  fileName: 'receipt.png',
  signedUrl: 'https://files.example/receipt.png',
  createdAt: '2026-07-01T00:00:00.000Z',
  contentType: 'image/png',
} as never;

describe('AttachmentWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());
  it('renders signed previews and persists pagination', () => {
    render(<AttachmentWorkspace initialAttachments={[attachment]} totalCount={30} page={1} pageSize={25} />);
    expect(screen.getByAltText('receipt.png')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Next'}));
    expect(mocks.push).toHaveBeenCalledWith('/attachments?page=2&pageSize=25');
  });
  it('confirms permanent deletion', async () => {
    mocks.remove.mockResolvedValue(true);
    render(<AttachmentWorkspace initialAttachments={[attachment]} totalCount={1} page={1} pageSize={25} />);
    fireEvent.click(screen.getByRole('button', {name: 'Delete receipt.png'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Delete attachment'}));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('a'));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
