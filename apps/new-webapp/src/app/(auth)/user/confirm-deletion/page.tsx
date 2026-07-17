import {ConfirmationView} from '@/components/confirmation-view';

export default function DeletionConfirmedPage() {
  return (
    <ConfirmationView
      title="Account deleted"
      description="Your account has been removed. This action cannot be undone."
      href="/sign-in"
      action="Return to sign in"
    />
  );
}
