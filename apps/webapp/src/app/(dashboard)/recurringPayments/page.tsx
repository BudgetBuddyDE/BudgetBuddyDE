import {Grid} from '@mui/material';
import {parseRecurringPaymentFiltersFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {RecurringPaymentTable} from '@/components/RecurringPayment/RecurringPaymentTable';

export default async function RecurringPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialFilters = parseRecurringPaymentFiltersFromParams(params);

  return (
    <ContentGrid title="Recurring Payments">
      <Grid size="grow">
        <RecurringPaymentTable initialFilters={initialFilters} />
      </Grid>
    </ContentGrid>
  );
}
