import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';
export default function ImportExportLoading() {
  return (
    <PageShell title="Import & export">
      <FeedbackPanel kind="loading" title="Loading import references" />
    </PageShell>
  );
}
