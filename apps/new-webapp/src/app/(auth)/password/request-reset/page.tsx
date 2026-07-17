import type {Metadata} from 'next';
import {AuthForm} from '@/components/auth-form';

export const metadata: Metadata = {title: 'Reset password'};

export default function RequestResetPage() {
  return <AuthForm mode="request-reset" />;
}
