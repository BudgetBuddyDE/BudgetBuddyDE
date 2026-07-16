import type {Metadata} from 'next';
import {AuthForm} from '@/components/auth-form';

export const metadata: Metadata = {title: 'Choose new password'};
export default function ResetPasswordPage() {
  return <AuthForm mode="reset-password" />;
}
