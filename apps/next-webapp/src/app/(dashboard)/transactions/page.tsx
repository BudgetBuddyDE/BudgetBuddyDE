import { ErrorAlert } from '@/components/ErrorAlert';
import { ContentGrid } from '@/components/Layout/ContentGrid';
import { TransactionTable } from '@/components/Transaction/TransactionTable';
import { TransactionService } from '@/services/Transaction.service';
import { Grid } from '@mui/material';
import { headers } from 'next/headers';

export default async function TransactionsPage() {
  const [transactions, error] = await TransactionService.getTransactions(undefined, {
    headers: await headers(),
  });
  return (
    <ContentGrid title="Transactions" description="Manage your transactions...">
      <Grid size="grow">
        {error ? <ErrorAlert error={error} /> : <TransactionTable transactions={transactions} />}
      </Grid>
    </ContentGrid>
  );
}
