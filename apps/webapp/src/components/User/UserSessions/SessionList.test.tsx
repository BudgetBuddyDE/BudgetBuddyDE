import {render, screen} from '@testing-library/react';
import type {Session} from 'better-auth';
import {describe, expect, it, vi} from 'vitest';
import {SessionList} from './SessionList';

vi.mock('@/authClient', () => ({
  authClient: {revokeSession: vi.fn()},
  revalidateSession: vi.fn(),
}));
vi.mock('@/components/Snackbar', () => ({useSnackbarContext: () => ({showSnackbar: vi.fn()})}));
vi.mock('@/logger', () => ({logger: {error: vi.fn()}}));

const session = {
  id: 'session-1',
  token: 'token-1',
  createdAt: new Date('2026-10-18T10:00:00.000Z'),
  expiresAt: new Date('2026-10-19T10:00:00.000Z'),
  userAgent: 'Test browser',
  ipAddress: '127.0.0.1',
} as Session;

describe('SessionList', () => {
  it('renders session details without nesting paragraphs inside paragraphs', () => {
    const {container} = render(<SessionList sessions={[session]} />);

    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('Test browser')).toBeInTheDocument();
    expect(container.querySelector('p p')).toBeNull();
    expect(container.querySelector('p div')).toBeNull();
  });
});
