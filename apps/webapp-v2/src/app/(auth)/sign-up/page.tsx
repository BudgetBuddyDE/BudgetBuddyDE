'use client';

import {Anchor, Checkbox, SimpleGrid, Stack, TextInput} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {useState} from 'react';
import {
  AuthDivider,
  AuthLinkButton,
  AuthPage,
  AuthSubmitButton,
  SocialAuthButtons,
} from '@/compositions/AuthPage/AuthPage';
import {PasswordInput} from '@/compositions/Form/PasswordInput';

export default function SignUpPage() {
  const [passwordError, setPasswordError] = useState<string | null>(null);

  return (
    <AuthPage title="Sign up">
      <Stack gap="md">
        <SocialAuthButtons
          onUnavailable={provider =>
            notifications.show({
              message: `${provider} sign-up is not connected in this demo.`,
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
            const formData = new FormData(event.currentTarget);
            if (formData.get('password') !== formData.get('confirm-password')) {
              setPasswordError('Passwords do not match.');
              notifications.show({
                message: 'Passwords do not match.',
                color: 'red',
                role: 'alert',
                'aria-live': 'assertive',
                'aria-atomic': true,
                closeButtonProps: {'aria-label': 'Dismiss notification'},
              });
              return;
            }
            setPasswordError(null);
            notifications.show({
              message: 'Demo sign-up complete. Authentication is not connected, so no account was created.',
              role: 'status',
              'aria-live': 'polite',
              'aria-atomic': true,
              closeButtonProps: {'aria-label': 'Dismiss notification'},
            });
          }}
        >
          <Stack gap="md">
            <SimpleGrid cols={2} spacing="sm">
              <TextInput label="Name" name="name" placeholder="Name" autoComplete="given-name" required />
              <TextInput label="Surname" name="surname" placeholder="Surname" autoComplete="family-name" required />
            </SimpleGrid>
            <TextInput
              label="E-Mail"
              name="email"
              type="email"
              placeholder="Enter email"
              autoComplete="email"
              required
            />
            <PasswordInput
              label="Password"
              name="password"
              placeholder="Enter password"
              autoComplete="new-password"
              withValidation
              error={passwordError}
              visibilityToggleButtonProps={{'aria-label': 'Toggle password visibility'}}
              required
              onChange={() => setPasswordError(null)}
            />
            <PasswordInput
              label="Confirm password"
              name="confirm-password"
              placeholder="Confirm password"
              autoComplete="new-password"
              visibilityToggleButtonProps={{'aria-label': 'Toggle confirmation visibility'}}
              required
              onChange={() => setPasswordError(null)}
            />
            <Checkbox
              name="terms"
              required
              label={
                <>
                  I accept the{' '}
                  <Anchor
                    href="https://budget-buddy.de/tos"
                    target="_blank"
                    rel="noreferrer"
                    c="blue"
                    underline="always"
                  >
                    Terms of Service
                  </Anchor>
                </>
              }
            />
            <AuthSubmitButton>Sign up</AuthSubmitButton>
          </Stack>
        </form>
        <AuthDivider>Already registered?</AuthDivider>
        <AuthLinkButton href="/sign-in">Sign in</AuthLinkButton>
      </Stack>
    </AuthPage>
  );
}
