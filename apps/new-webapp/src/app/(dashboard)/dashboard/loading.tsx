import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';

export default function DashboardLoading() {
  return (
    <PageShell title="Dashboard">
      <FeedbackPanel kind="loading" title="Loading financial overview" />
    </PageShell>
  );
}
