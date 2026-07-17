import type {Metadata} from 'next';
import {AuthForm} from '@/components/auth-form';

export const metadata: Metadata = {title: 'Choose a new password'};

export default async function ResetPasswordPage({searchParams}: {searchParams: Promise<{token?: string}>}) {
  const {token} = await searchParams;
  return <AuthForm mode="reset-password" token={token} />;
}
