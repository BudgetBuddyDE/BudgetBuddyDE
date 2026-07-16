import {AccountStatus} from '@/components/account-status';
export default function DeletionConfirmedPage() {
  return (
    <AccountStatus
      title="Account deletion confirmed"
      description="Your account has been scheduled for deletion. You can close this window."
    />
  );
}
