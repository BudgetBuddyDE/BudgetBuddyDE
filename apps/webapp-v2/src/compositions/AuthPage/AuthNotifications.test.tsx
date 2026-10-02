import {MantineProvider} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {fireEvent, render, screen} from '@testing-library/react';
import type {ComponentProps, ReactNode} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import RequestPasswordResetPage from '../../app/(auth)/password/request-reset/page';
import SignInPage from '../../app/(auth)/sign-in/page';
import SignUpPage from '../../app/(auth)/sign-up/page';

vi.mock('@mantine/notifications', () => ({notifications: {show: vi.fn()}}));
vi.mock('next/link', () => ({default: (props: ComponentProps<'a'>) => <a {...props} />}));

function TestProvider({children}: {children: ReactNode}) {
  return (
    <MantineProvider env="test" defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}

function submitForm(buttonName: string) {
  const form = screen.getByRole('button', {name: buttonName}).closest('form');
  if (!form) throw new Error(`No form found for ${buttonName}`);
  fireEvent.submit(form);
}

function fillSignUp(password = 'Abcd12!', confirmation = password) {
  fireEvent.change(screen.getByLabelText(/^Name\s*\*?$/), {target: {value: 'Demo'}});
  fireEvent.change(screen.getByLabelText(/^Surname\s*\*?$/), {target: {value: 'User'}});
  fireEvent.change(screen.getByLabelText(/^E-Mail\s*\*?$/), {target: {value: 'demo@example.com'}});
  fireEvent.change(screen.getByLabelText(/^Password\s*\*?$/), {target: {value: password}});
  fireEvent.change(screen.getByLabelText(/^Confirm password\s*\*?$/), {target: {value: confirmation}});
  fireEvent.click(screen.getByRole('checkbox', {name: 'I accept the Terms of Service'}));
}

describe('Auth notifications', () => {
  beforeEach(() => {
    vi.mocked(notifications.show).mockClear();
  });

  it('dispatches the sign-in demo result through native notifications', () => {
    render(<SignInPage />, {wrapper: TestProvider});
    fireEvent.change(screen.getByLabelText(/^E-Mail\s*\*?$/), {target: {value: 'demo@example.com'}});
    fireEvent.change(screen.getByLabelText(/^Password\s*\*?$/), {target: {value: 'Abcd12!'}});

    submitForm('Sign in');

    expect(notifications.show).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message: 'Demo sign-in complete. Authentication is not connected, so no session was created.',
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
        closeButtonProps: {'aria-label': 'Dismiss notification'},
      }),
    );
  });

  it.each([
    {Page: SignInPage, action: 'sign-in', provider: 'Google'},
    {Page: SignInPage, action: 'sign-in', provider: 'GitHub'},
    {Page: SignUpPage, action: 'sign-up', provider: 'Google'},
    {Page: SignUpPage, action: 'sign-up', provider: 'GitHub'},
  ])('dispatches the unavailable $provider $action result', ({Page, action, provider}) => {
    render(<Page />, {wrapper: TestProvider});

    fireEvent.click(screen.getByRole('button', {name: provider}));

    expect(notifications.show).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({message: `${provider} ${action} is not connected in this demo.`}),
    );
  });

  it('dispatches the sign-up demo result for matching passwords', () => {
    render(<SignUpPage />, {wrapper: TestProvider});
    fillSignUp();

    submitForm('Sign up');

    expect(notifications.show).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message: 'Demo sign-up complete. Authentication is not connected, so no account was created.',
        role: 'status',
        'aria-live': 'polite',
      }),
    );
    expect(screen.queryByText('Passwords do not match.')).not.toBeInTheDocument();
  });

  it('dispatches an error notification and retains the inline password mismatch', () => {
    render(<SignUpPage />, {wrapper: TestProvider});
    fillSignUp('Abcd12!', 'Different12!');

    submitForm('Sign up');

    expect(notifications.show).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message: 'Passwords do not match.',
        color: 'red',
        role: 'alert',
        'aria-live': 'assertive',
      }),
    );
    expect(screen.getByLabelText(/^Password\s*\*?$/)).toHaveAccessibleDescription('Passwords do not match.');
    expect(screen.getByText('Passwords do not match.')).toBeVisible();
  });

  it.each(['Password', 'Confirm password'])('clears the inline mismatch when %s is edited', field => {
    render(<SignUpPage />, {wrapper: TestProvider});
    fillSignUp('Abcd12!', 'Different12!');
    submitForm('Sign up');
    expect(screen.getByText('Passwords do not match.')).toBeVisible();

    fireEvent.change(screen.getByLabelText(new RegExp(`^${field}\\s*\\*?$`)), {
      target: {value: field === 'Password' ? 'Different12!' : 'Abcd12!'},
    });

    expect(screen.queryByText('Passwords do not match.')).not.toBeInTheDocument();
    expect(notifications.show).toHaveBeenCalledTimes(1);

    submitForm('Sign up');

    expect(notifications.show).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'Demo sign-up complete. Authentication is not connected, so no account was created.',
      }),
    );
  });

  it('dispatches the privacy-preserving password reset demo result', () => {
    render(<RequestPasswordResetPage />, {wrapper: TestProvider});
    fireEvent.change(screen.getByLabelText(/^E-Mail\s*\*?$/), {target: {value: 'demo@example.com'}});

    submitForm('Submit request');

    expect(notifications.show).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message:
          'Demo request received. In the live service, an email would be sent if an account exists. No email was sent in this demo.',
        role: 'status',
        'aria-live': 'polite',
      }),
    );
  });
});
