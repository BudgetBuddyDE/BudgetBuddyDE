import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';

export default function PaymentMethodsLoading() {
  return (
    <PageShell title="Payment methods">
      <FeedbackPanel kind="loading" title="Loading payment methods" />
    </PageShell>
  );
}
