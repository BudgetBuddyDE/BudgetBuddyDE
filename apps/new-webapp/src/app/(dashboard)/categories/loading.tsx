import {FeedbackPanel} from '@/components/feedback-panel';
import {PageShell} from '@/components/page-shell';

export default function CategoriesLoading() {
  return (
    <PageShell title="Categories">
      <FeedbackPanel kind="loading" title="Loading categories" />
    </PageShell>
  );
}
