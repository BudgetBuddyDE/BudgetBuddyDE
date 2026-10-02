'use client';

import {Box, Button, Card, Divider, Group, Stack, Text, ThemeIcon, Title} from '@mantine/core';
import {IconBrandGithub, IconBrandGoogle, IconPigMoney} from '@tabler/icons-react';
import Link from 'next/link';
import type {ReactNode} from 'react';

export function AuthPage({title, children}: {title: string; children: ReactNode}) {
  return (
    <Card component="section" p="xl" radius="md" shadow="sm" withBorder w="100%" maw={512} mx="auto">
      <Stack align="center" gap="md" mb="lg">
        <ThemeIcon size={80} radius="md" color="blue" variant="filled" role="img" aria-label="BudgetBuddyDE logo">
          <Box pos="relative" h={58} w={58}>
            <IconPigMoney size={50} stroke={1.7} aria-hidden="true" />
            <Text
              pos="absolute"
              bottom={-2}
              right={-3}
              size="xs"
              fw={900}
              c="white"
              bg="var(--mantine-color-blue-filled)"
              px={3}
              style={{borderRadius: 'var(--mantine-radius-xs)'}}
            >
              BB
            </Text>
          </Box>
        </ThemeIcon>
        <Title order={1} ta="center" size="h2">
          {title}
        </Title>
      </Stack>
      {children}
    </Card>
  );
}

export function AuthDivider({children}: {children: ReactNode}) {
  return <Divider label={children} labelPosition="center" />;
}

export function SocialAuthButtons({onUnavailable}: {onUnavailable: (provider: string) => void}) {
  return (
    <Group grow>
      <Button
        type="button"
        color="blue"
        leftSection={<IconBrandGoogle size={18} aria-hidden="true" />}
        onClick={() => onUnavailable('Google')}
      >
        Google
      </Button>
      <Button
        type="button"
        color="blue"
        leftSection={<IconBrandGithub size={18} aria-hidden="true" />}
        onClick={() => onUnavailable('GitHub')}
      >
        GitHub
      </Button>
    </Group>
  );
}

export function AuthSubmitButton({children}: {children: ReactNode}) {
  return (
    <Group justify="center">
      <Button type="submit" color="blue" rightSection={<span aria-hidden="true">➜</span>}>
        {children}
      </Button>
    </Group>
  );
}

export function AuthLinkButton({href, children}: {href: string; children: ReactNode}) {
  return (
    <Button component={Link} href={href} color="blue" fullWidth>
      {children}
    </Button>
  );
}
