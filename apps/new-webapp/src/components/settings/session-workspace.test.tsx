import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SessionWorkspace} from './session-workspace';
const mocks = vi.hoisted(() => ({revoke: vi.fn(), revokeOthers: vi.fn(), push: vi.fn()}));
vi.mock('@/authClient', () => ({authClient: {revokeSession: mocks.revoke, revokeOtherSessions: mocks.revokeOthers}}));
vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push})}));
const sessions = [
  {
    id: 's1',
    token: 'active',
    userAgent: 'Chrome',
    ipAddress: '127.0.0.1',
    createdAt: new Date(),
    expiresAt: new Date(),
  },
  {
    id: 's2',
    token: 'other',
    userAgent: 'Firefox',
    ipAddress: '127.0.0.2',
    createdAt: new Date(),
    expiresAt: new Date(),
  },
] as never;

describe('SessionWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());
  it('marks the active session and revokes all others', async () => {
    mocks.revokeOthers.mockResolvedValue({error: null});
    render(<SessionWorkspace initialSessions={sessions} activeToken="active" />);
    expect(screen.getByText('Current session')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Revoke all other sessions'}));
    await waitFor(() => expect(mocks.revokeOthers).toHaveBeenCalled());
    expect(screen.queryByText('Firefox')).not.toBeInTheDocument();
  });
  it('confirms current-session revocation and redirects to sign in', async () => {
    mocks.revoke.mockResolvedValue({error: null});
    render(<SessionWorkspace initialSessions={sessions} activeToken="active" />);
    fireEvent.click(screen.getByRole('button', {name: 'Revoke current session'}));
    expect(await screen.findByRole('dialog')).toHaveTextContent('signed out');
    fireEvent.click(screen.getByRole('button', {name: 'Revoke session'}));
    await waitFor(() => expect(mocks.revoke).toHaveBeenCalledWith({token: 'active'}));
    expect(mocks.push).toHaveBeenCalledWith('/sign-in');
  });
});
