import Link from 'next/link';
import {FeedbackPanel} from '@/components/feedback-panel';
import {buttonVariants} from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-[70dvh] place-items-center p-6">
      <FeedbackPanel
        kind="empty"
        title="Page not found"
        description="The requested page does not exist or is no longer available."
        action={
          <Link className={buttonVariants()} href="/dashboard">
            Return to dashboard
          </Link>
        }
      />
    </main>
  );
}
