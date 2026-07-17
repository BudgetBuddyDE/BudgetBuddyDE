import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AuthForm} from './auth-form';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  emailSignIn: vi.fn(),
  socialSignIn: vi.fn(),
  emailSignUp: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push, refresh: mocks.refresh})}));
vi.mock('@/authClient', () => ({
  authClient: {
    signIn: {email: mocks.emailSignIn, social: mocks.socialSignIn},
    signUp: {email: mocks.emailSignUp},
    requestPasswordReset: mocks.requestPasswordReset,
    resetPassword: mocks.resetPassword,
  },
}));

describe('AuthForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates sign-in fields before calling the service', async () => {
    render(<AuthForm mode="sign-in" />);
    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'invalid'}});
    fireEvent.change(screen.getByLabelText('Password'), {target: {value: 'short'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Sign in'}).closest('form')!);
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(mocks.emailSignIn).not.toHaveBeenCalled();
  });

  it('signs in and navigates to the protected dashboard', async () => {
    mocks.emailSignIn.mockResolvedValue({data: {}, error: null});
    render(<AuthForm mode="sign-in" />);
    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'person@example.com'}});
    fireEvent.change(screen.getByLabelText('Password'), {target: {value: 'password123'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Sign in'}).closest('form')!);
    await waitFor(() =>
      expect(mocks.emailSignIn).toHaveBeenCalledWith({email: 'person@example.com', password: 'password123'}),
    );
    expect(mocks.push).toHaveBeenCalledWith('/dashboard');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('requires email verification before entering the protected app', async () => {
    mocks.emailSignUp.mockResolvedValue({data: {}, error: null});
    render(<AuthForm mode="sign-up" />);
    fireEvent.change(screen.getByLabelText('First name'), {target: {value: 'Ada'}});
    fireEvent.change(screen.getByLabelText('Last name'), {target: {value: 'Lovelace'}});
    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'ada+test@example.com'}});
    fireEvent.change(screen.getByLabelText('Password'), {target: {value: 'password123'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Create account'}).closest('form')!);
    await waitFor(() => expect(mocks.emailSignUp).toHaveBeenCalled());
    expect(mocks.push).toHaveBeenCalledWith('/email/pending?email=ada%2Btest%40example.com');
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('shows enumeration-safe feedback after a reset request', async () => {
    mocks.requestPasswordReset.mockResolvedValue({data: {}, error: null});
    render(<AuthForm mode="request-reset" />);
    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'person@example.com'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Send reset link'}).closest('form')!);
    expect(await screen.findByText(/If an account exists/)).toBeInTheDocument();
  });

  it('does not submit a password reset without a token', async () => {
    render(<AuthForm mode="reset-password" />);
    fireEvent.change(screen.getByLabelText('New password'), {target: {value: 'new-password'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Save new password'}).closest('form')!);
    expect(await screen.findByText('This reset link is invalid or incomplete.')).toBeInTheDocument();
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });
});
