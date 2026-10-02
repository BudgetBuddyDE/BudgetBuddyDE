'use client';

import {Stack, TextInput} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {AuthDivider, AuthLinkButton, AuthPage, AuthSubmitButton} from '@/compositions/AuthPage/AuthPage';

export default function RequestPasswordResetPage() {
  return (
    <AuthPage title="Request password reset">
      <Stack gap="md">
        <form
          onSubmit={event => {
            event.preventDefault();
            notifications.show({
              message:
                'Demo request received. In the live service, an email would be sent if an account exists. No email was sent in this demo.',
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
            <AuthSubmitButton>Submit request</AuthSubmitButton>
          </Stack>
        </form>
        <AuthDivider>or</AuthDivider>
        <Stack gap="sm">
          <AuthLinkButton href="/sign-in">Sign in</AuthLinkButton>
          <AuthLinkButton href="/sign-up">Create an account</AuthLinkButton>
        </Stack>
      </Stack>
    </AuthPage>
  );
}
