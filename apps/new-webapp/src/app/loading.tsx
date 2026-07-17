import {FeedbackPanel} from '@/components/feedback-panel';

export default function Loading() {
  return (
    <main className="grid min-h-[50dvh] place-items-center p-6">
      <FeedbackPanel kind="loading" title="Loading BudgetBuddy" />
    </main>
  );
}
