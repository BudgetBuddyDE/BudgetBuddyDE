import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {AuthForm, AuthVisual} from './auth-form';

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  social: vi.fn(),
  signUp: vi.fn(),
  requestReset: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock('@/authClient', () => ({
  authClient: {
    signIn: {email: authMocks.signIn, social: authMocks.social},
    signUp: {email: authMocks.signUp},
    requestPasswordReset: authMocks.requestReset,
    resetPassword: authMocks.resetPassword,
  },
}));

describe('authentication experience', () => {
  it('validates sign-in fields before contacting the service', async () => {
    render(<AuthForm mode="sign-in" />);
    await userEvent.click(screen.getByRole('button', {name: /^sign in/i}));
    expect(await screen.findByRole('alert')).toHaveTextContent(/email/i);
    expect(authMocks.signIn).not.toHaveBeenCalled();
  });

  it('submits email credentials and exposes account recovery', async () => {
    authMocks.signIn.mockResolvedValue({data: {}, error: null});
    render(<AuthForm mode="sign-in" />);
    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse');
    await userEvent.click(screen.getByRole('button', {name: /^sign in/i}));
    expect(authMocks.signIn).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'correct-horse',
      callbackURL: '/dashboard',
    });
    expect(screen.getByRole('link', {name: 'Forgot password?'})).toHaveAttribute('href', '/password/request-reset');
  });

  it('renders the visual security proposition and sign-up fields', () => {
    render(
      <>
        <AuthVisual />
        <AuthForm mode="sign-up" />
      </>,
    );
    expect(screen.getByText(/private by design/i)).toBeVisible();
    expect(screen.getByLabelText('First name')).toBeVisible();
    expect(screen.getByLabelText('Last name')).toBeVisible();
  });
});
