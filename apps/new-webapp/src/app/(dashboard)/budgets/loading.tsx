import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';

export default function BudgetsLoading() {
  return (
    <PageShell title="Budgets">
      <FeedbackPanel kind="loading" title="Loading monthly budgets" />
    </PageShell>
  );
}
