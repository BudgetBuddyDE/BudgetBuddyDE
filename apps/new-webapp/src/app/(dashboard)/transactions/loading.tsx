import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';

export default function TransactionsLoading() {
  return (
    <PageShell title="Transactions">
      <FeedbackPanel
        kind="loading"
        title="Loading transactions"
        description="Fetching the selected page and reference data."
      />
    </PageShell>
  );
}
