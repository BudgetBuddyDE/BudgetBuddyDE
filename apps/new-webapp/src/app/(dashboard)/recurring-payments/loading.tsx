import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';

export default function RecurringPaymentsLoading() {
  return (
    <PageShell title="Recurring payments">
      <FeedbackPanel kind="loading" title="Loading recurring payments" />
    </PageShell>
  );
}
