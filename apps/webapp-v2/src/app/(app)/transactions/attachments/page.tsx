import {transactionTabs} from '@/app/(app)/pageTabs';
import {PageHeader} from '@/compositions/PageHeader/PageHeader';

export default function TransactionAttachmentsPage() {
  return <PageHeader title="Transaction Attachments" tabs={transactionTabs} />;
}
