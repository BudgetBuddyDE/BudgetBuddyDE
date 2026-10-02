import {transactionTabs} from '@/app/(app)/pageTabs';
import {PageHeader} from '@/compositions/PageHeader/PageHeader';

export default function TransactionsPage() {
  return <PageHeader title="Transactions" tabs={transactionTabs} />;
}
