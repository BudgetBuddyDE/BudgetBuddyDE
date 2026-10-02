import {Box, Stack} from '@mantine/core';
import type {ReactNode} from 'react';
import {DashboardNavigation} from '@/compositions/DashboardNavigation/DashboardNavigation';

export default function DashboardLayout({children}: {children: ReactNode}) {
  return (
    <Stack gap="lg" miw={0}>
      <Box>
        <DashboardNavigation />
      </Box>
      {children}
    </Stack>
  );
}
