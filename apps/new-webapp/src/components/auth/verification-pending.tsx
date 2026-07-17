'use client';

import {useState} from 'react';
import {authClient} from '@/authClient';
import {Button} from '@/components/ui/button';

export function VerificationPending({email}: {email: string}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const resend = async () => {
    setPending(true);
    setMessage(undefined);
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/email/verified`,
      });
      setMessage(result.error ? 'The verification email could not be sent. Try again.' : 'Verification email sent.');
    } catch {
      setMessage('The authentication service could not be reached. Try again.');
    } finally {
      setPending(false);
    }
  };
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We sent a verification link to <strong>{email}</strong>. Verify the address before signing in.
      </p>
      <Button className="mt-6" variant="outline" disabled={pending || !email} onClick={resend}>
        {pending ? 'Sending…' : 'Resend verification email'}
      </Button>
      <p className="mt-4 text-sm" role="status">
        {message}
      </p>
    </div>
  );
}
