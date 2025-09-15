'use client';

import { ContentGrid } from '@/components/Layout/ContentGrid';
import { SubscriptionTable } from '@/components/Subscription/SubscriptionTable';
import { Grid } from '@mui/material';

export default function SubscriptionsPage() {
  return (
    <ContentGrid title="Subscriptions">
      <Grid size="grow">
        <SubscriptionTable />
      </Grid>
    </ContentGrid>
  );
}
