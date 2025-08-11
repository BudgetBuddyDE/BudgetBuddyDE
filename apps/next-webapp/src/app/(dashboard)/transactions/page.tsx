import { ContentGrid } from '@/components/Layout/ContentGrid';
import { TransactionTable } from '@/components/Transaction/TransactionTable';
import { Grid } from '@mui/material';

export default async function TransactionsPage() {
  return (
    <ContentGrid title="Transactions">
      <Grid size="grow">
        <TransactionTable />
      </Grid>
    </ContentGrid>
  );
}
