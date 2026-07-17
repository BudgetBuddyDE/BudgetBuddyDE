import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';
export default function ReportsLoading() {
  return (
    <PageShell title="Reports">
      <FeedbackPanel kind="loading" title="Loading annual report" />
    </PageShell>
  );
}
