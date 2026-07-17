import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';
export default function AttachmentsLoading() {
  return (
    <PageShell title="Attachments">
      <FeedbackPanel kind="loading" title="Loading secure previews" />
    </PageShell>
  );
}
