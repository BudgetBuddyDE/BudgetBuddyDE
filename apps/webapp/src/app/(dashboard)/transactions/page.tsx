import {Grid} from '@mui/material';
import {parseTransactionFiltersFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {TransactionTable} from '@/components/Transaction/TransactionTable';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialFilters = parseTransactionFiltersFromParams(params);

  return (
    <ContentGrid title="Transactions">
      <Grid size="grow">
        <TransactionTable initialFilters={initialFilters} />
      </Grid>
    </ContentGrid>
  );
}
