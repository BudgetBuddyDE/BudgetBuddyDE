import type {Metadata} from 'next';
import {VerificationPending} from '@/components/auth/verification-pending';

export const metadata: Metadata = {title: 'Verify email'};

export default async function VerificationPendingPage({searchParams}: {searchParams: Promise<{email?: string}>}) {
  const {email = ''} = await searchParams;
  return <VerificationPending email={email} />;
}
