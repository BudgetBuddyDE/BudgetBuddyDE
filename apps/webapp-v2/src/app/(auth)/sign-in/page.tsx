'use client';

import {Anchor, Stack, TextInput} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import Link from 'next/link';
import {
  AuthDivider,
  AuthLinkButton,
  AuthPage,
  AuthSubmitButton,
  SocialAuthButtons,
} from '@/compositions/AuthPage/AuthPage';
import {PasswordInput} from '@/compositions/Form/PasswordInput';

export default function SignInPage() {
  return (
    <AuthPage title="Sign in">
      <Stack gap="md">
        <SocialAuthButtons
          onUnavailable={provider =>
            notifications.show({
              message: `${provider} sign-in is not connected in this demo.`,
              role: 'status',
              'aria-live': 'polite',
              'aria-atomic': true,
              closeButtonProps: {'aria-label': 'Dismiss notification'},
            })
          }
        />
        <AuthDivider>or with</AuthDivider>
        <form
          onSubmit={event => {
            event.preventDefault();
            notifications.show({
              message: 'Demo sign-in complete. Authentication is not connected, so no session was created.',
              role: 'status',
              'aria-live': 'polite',
              'aria-atomic': true,
              closeButtonProps: {'aria-label': 'Dismiss notification'},
            });
          }}
        >
          <Stack gap="md">
            <TextInput
              label="E-Mail"
              name="email"
              type="email"
              placeholder="Enter email"
              autoComplete="email"
              required
            />
            <Stack gap={4}>
              <PasswordInput
                label="Password"
                name="password"
                placeholder="Enter password"
                autoComplete="current-password"
                visibilityToggleButtonProps={{'aria-label': 'Toggle password visibility'}}
                required
              />
              <Anchor component={Link} href="/password/request-reset" size="sm" c="blue" w="fit-content">
                Forgot password?
              </Anchor>
            </Stack>
            <AuthSubmitButton>Sign in</AuthSubmitButton>
          </Stack>
        </form>
        <AuthDivider>No account?</AuthDivider>
        <AuthLinkButton href="/sign-up">Create an account</AuthLinkButton>
      </Stack>
    </AuthPage>
  );
}
