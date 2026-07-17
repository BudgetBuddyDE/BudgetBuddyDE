import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ApiKeyWorkspace} from './api-key-workspace';
const mocks = vi.hoisted(() => ({list: vi.fn(), create: vi.fn(), remove: vi.fn()}));
vi.mock('@/authClient', () => ({authClient: {apiKey: {list: mocks.list, create: mocks.create, delete: mocks.remove}}}));
const key = {id: 'k1', name: 'Automation', enabled: true, createdAt: new Date(), expiresAt: null};

describe('ApiKeyWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue({data: {apiKeys: [key]}, error: null});
  });
  it('creates a key and requires one-time-secret acknowledgement', async () => {
    mocks.create.mockResolvedValue({data: {key: 'bb-secret'}, error: null});
    render(<ApiKeyWorkspace />);
    await screen.findByText('Automation');
    fireEvent.click(screen.getByRole('button', {name: 'Create API key'}));
    fireEvent.change(screen.getByLabelText('API key name'), {target: {value: 'CLI'}});
    fireEvent.click(screen.getByRole('button', {name: 'Create key'}));
    expect(await screen.findByDisplayValue('bb-secret')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'I stored the key'})).toBeDisabled();
    fireEvent.click(screen.getByLabelText('I understand this key is shown once.'));
    expect(screen.getByRole('button', {name: 'I stored the key'})).toBeEnabled();
  });
  it('confirms immediate key revocation', async () => {
    mocks.remove.mockResolvedValue({error: null});
    render(<ApiKeyWorkspace />);
    await screen.findByText('Automation');
    fireEvent.click(screen.getByRole('button', {name: 'Revoke Automation'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Revoke API key'}));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith({keyId: 'k1'}));
  });
});
