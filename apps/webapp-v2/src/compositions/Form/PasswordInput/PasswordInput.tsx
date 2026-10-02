'use client';

import {
  Box,
  Group,
  List,
  PasswordInput as MantinePasswordInput,
  Progress,
  Text,
  ThemeIcon,
  VisuallyHidden,
} from '@mantine/core';
import type {PasswordInputProps as MantinePasswordInputProps} from '@mantine/core';
import {useUncontrolled} from '@mantine/hooks';
import {IconCheck, IconX} from '@tabler/icons-react';
import {useId} from 'react';
import type {Ref} from 'react';

export interface PasswordInputProps extends Omit<MantinePasswordInputProps, 'value' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  ref?: Ref<HTMLInputElement>;
  /** Shows password strength and requirement hints. Disabled by default. */
  withValidation?: boolean;
}

const requirements = [
  {label: 'At least 6 characters', test: (password: string) => password.length >= 6},
  {label: 'A number', test: (password: string) => /[0-9]/.test(password)},
  {label: 'A lowercase letter', test: (password: string) => /[a-z]/.test(password)},
  {label: 'An uppercase letter', test: (password: string) => /[A-Z]/.test(password)},
  {label: 'A special symbol (e.g. !, @, #)', test: (password: string) => /[$&+,:;=?@#|'<>.^*()%!-]/.test(password)},
];

function getStrength(password: string) {
  if (password.length === 0) return 0;
  if (password.length < 5) return 10;

  const missingRequirements = requirements.filter(requirement => !requirement.test(password)).length;

  return Math.max(100 - (100 / requirements.length) * missingRequirements, 10);
}

export function PasswordInput({
  withValidation = false,
  value,
  defaultValue,
  onChange,
  visibilityToggleButtonProps,
  ...props
}: PasswordInputProps) {
  const requirementsId = useId();
  const [password, setPassword] = useUncontrolled({value, defaultValue, finalValue: ''});
  const strength = getStrength(password);
  const color = strength < 30 ? 'red' : strength < 50 ? 'orange' : strength < 70 ? 'yellow' : 'teal';
  const strengthLabel =
    password.length === 0
      ? 'Empty'
      : strength < 30
        ? 'Weak'
        : strength < 50
          ? 'Fair'
          : strength < 70
            ? 'Good'
            : 'Strong';
  const segments = [password.length > 0, strength >= 30, strength >= 50, strength >= 70];
  const requirementChecks = requirements.map(requirement => ({...requirement, met: requirement.test(password)}));
  const missingLabels = requirementChecks.filter(requirement => !requirement.met).map(requirement => requirement.label);

  return (
    <Box>
      <MantinePasswordInput
        {...props}
        aria-details={
          withValidation ? [props['aria-details'], requirementsId].filter(Boolean).join(' ') : props['aria-details']
        }
        value={password}
        onChange={event => {
          setPassword(event.currentTarget.value);
          onChange?.(event);
        }}
        visibilityToggleButtonProps={{'aria-label': 'Toggle password visibility', ...visibilityToggleButtonProps}}
      />
      {withValidation && (
        <>
          <Group
            grow
            gap={5}
            mt="xs"
            role="meter"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={strength}
            aria-valuetext={strengthLabel}
          >
            {segments.map((filled, index) => (
              <Progress
                key={index}
                size="xs"
                color={color}
                value={filled ? 100 : 0}
                transitionDuration={0}
                aria-hidden="true"
              />
            ))}
          </Group>
          <Text size="xs" c="dimmed" mt="xs" mb={4}>
            For full strength, include:
          </Text>
          <List id={requirementsId} spacing={4} size="xs" aria-label="Password requirements">
            {requirementChecks.map(requirement => (
              <List.Item
                key={requirement.label}
                icon={
                  <ThemeIcon variant="transparent" c={requirement.met ? 'teal' : 'dimmed'} size={16}>
                    {requirement.met ? (
                      <IconCheck size={14} aria-hidden="true" />
                    ) : (
                      <IconX size={14} aria-hidden="true" />
                    )}
                  </ThemeIcon>
                }
              >
                <VisuallyHidden>{requirement.met ? 'Met: ' : 'Missing: '}</VisuallyHidden>
                {requirement.label}
              </List.Item>
            ))}
          </List>
          <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
            {missingLabels.length > 0 ? `Missing: ${missingLabels.join(', ')}.` : 'All password requirements met.'}
          </VisuallyHidden>
        </>
      )}
    </Box>
  );
}
