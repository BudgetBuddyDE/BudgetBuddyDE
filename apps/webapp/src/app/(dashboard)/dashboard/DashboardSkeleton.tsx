import {Box, Grid, Skeleton, Stack} from '@mui/material';
import {Card} from '@/components/Card';
import {DashboardStatsWrapper} from './DashboardStatsWrapper';

export function DashboardCardSkeleton({
  title,
  subtitle,
  chart = false,
}: {
  title: string;
  subtitle: string;
  chart?: boolean;
}) {
  return (
    <Card aria-label={`Loading ${title}`}>
      <Card.Header>
        <Box>
          <Card.Title>{title}</Card.Title>
          <Card.Subtitle>{subtitle}</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{pt: 1}}>
        {chart ? (
          <Skeleton variant="rounded" height={220} />
        ) : (
          <Stack spacing={1.5}>
            {Array.from({length: 4}, (_, index) => (
              <Skeleton key={index} variant="rounded" height={44} />
            ))}
          </Stack>
        )}
      </Card.Body>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <Grid size={{xs: 12}} sx={{height: 2}} />
      <DashboardStatsWrapper />
      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 3, md: 1},
        }}
      >
        <DashboardCardSkeleton title="Upcoming recurring payments" subtitle="Your upcoming recurring payments" />
      </Grid>
      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 1, md: 2},
        }}
      >
        <Stack spacing={2}>
          <DashboardCardSkeleton title="Category Expenses" subtitle="Expenses per category" chart />
          <DashboardCardSkeleton title="Budget" subtitle="How much can you spend?" chart />
        </Stack>
      </Grid>
      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 2, md: 3},
        }}
      >
        <Stack spacing={2}>
          <DashboardCardSkeleton title="Transactions" subtitle="Your latest transactions" />
          <DashboardCardSkeleton title="Transactions" subtitle="Your upcoming transactions" />
        </Stack>
      </Grid>
    </>
  );
}
