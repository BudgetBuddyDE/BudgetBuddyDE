import {Anchor, Box, Center, Container, Text} from '@mantine/core';
import type {ReactNode} from 'react';
import {version} from '../../../package.json';

export function SiteLayout({children}: {children: ReactNode}) {
  return (
    <Box
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
      <Center component="main" py="xl" style={{flex: '1 0 auto', minWidth: 0}}>
        <Container size="xs" w="100%">
          {children}
        </Container>
      </Center>

      <Box component="footer" px="md" py="md" style={{flexShrink: 0}}>
        <Text size="sm" c="dimmed" ta="center">
          © {new Date().getFullYear()}{' '}
          <Anchor href="https://budgetbuddy.dev" size="inherit" c="inherit" underline="always">
            BudgetBuddyDE
          </Anchor>{' '}
          {version}
        </Text>
      </Box>
    </Box>
  );
}
