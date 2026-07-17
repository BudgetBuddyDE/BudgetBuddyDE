import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {VerificationPending} from './verification-pending';

const sendVerificationEmail = vi.hoisted(() => vi.fn());
vi.mock('@/authClient', () => ({authClient: {sendVerificationEmail}}));

describe('VerificationPending', () => {
  beforeEach(() => vi.clearAllMocks());
  it('resends verification with a safe post-verification callback', async () => {
    sendVerificationEmail.mockResolvedValue({data: {}, error: null});
    render(<VerificationPending email="person@example.com" />);
    fireEvent.click(screen.getByRole('button', {name: 'Resend verification email'}));
    await waitFor(() =>
      expect(sendVerificationEmail).toHaveBeenCalledWith({
        email: 'person@example.com',
        callbackURL: `${window.location.origin}/email/verified`,
      }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Verification email sent.');
  });
  it('reports resend failures without claiming success', async () => {
    sendVerificationEmail.mockResolvedValue({data: null, error: {status: 500}});
    render(<VerificationPending email="person@example.com" />);
    fireEvent.click(screen.getByRole('button', {name: 'Resend verification email'}));
    expect(await screen.findByRole('status')).toHaveTextContent('could not be sent');
  });
});
