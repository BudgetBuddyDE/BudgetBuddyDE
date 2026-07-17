import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';
export default function AnalyticsLoading() {
  return (
    <PageShell title="Analytics">
      <FeedbackPanel kind="loading" title="Loading analytics" />
    </PageShell>
  );
}
