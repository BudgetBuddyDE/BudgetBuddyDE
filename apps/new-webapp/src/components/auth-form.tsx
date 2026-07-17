'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {z} from 'zod';
import {authClient} from '@/authClient';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

export type AuthMode = 'sign-in' | 'sign-up' | 'request-reset' | 'reset-password';

const emailSchema = z.email('Enter a valid email address.');
const passwordSchema = z.string().min(8, 'Use at least 8 characters.');

interface AuthFormProps {
  mode: AuthMode;
  token?: string;
}

const content: Record<AuthMode, {title: string; submit: string}> = {
  'sign-in': {title: 'Welcome back', submit: 'Sign in'},
  'sign-up': {title: 'Create your account', submit: 'Create account'},
  'request-reset': {title: 'Reset your password', submit: 'Send reset link'},
  'reset-password': {title: 'Choose a new password', submit: 'Save new password'},
};

export function AuthForm({mode, token}: AuthFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = async (formData: FormData) => {
    setPending(true);
    setMessage(undefined);
    setFieldErrors({});
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const nextErrors: Record<string, string> = {};

    if (mode !== 'reset-password') {
      const parsedEmail = emailSchema.safeParse(email);
      if (!parsedEmail.success) nextErrors.email = parsedEmail.error.issues[0]?.message ?? 'Invalid email.';
    }
    if (mode !== 'request-reset') {
      const parsedPassword = passwordSchema.safeParse(password);
      if (!parsedPassword.success) nextErrors.password = parsedPassword.error.issues[0]?.message ?? 'Invalid password.';
    }
    if (mode === 'sign-up') {
      if (!String(formData.get('firstName') ?? '').trim()) nextErrors.firstName = 'Enter your first name.';
      if (!String(formData.get('lastName') ?? '').trim()) nextErrors.lastName = 'Enter your last name.';
    }
    if (mode === 'reset-password' && !token) nextErrors.form = 'This reset link is invalid or incomplete.';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setPending(false);
      return;
    }

    try {
      if (mode === 'sign-in') {
        const result = await authClient.signIn.email({email, password});
        if (result.error) {
          setMessage(
            result.error.status === 401
              ? 'Email or password is incorrect.'
              : 'Sign in is temporarily unavailable. Try again.',
          );
          return;
        }
        router.push('/dashboard');
        router.refresh();
      } else if (mode === 'sign-up') {
        const name = `${String(formData.get('firstName')).trim()} ${String(formData.get('lastName')).trim()}`;
        const result = await authClient.signUp.email({
          email,
          password,
          name,
          callbackURL: `${window.location.origin}/email/verified`,
        });
        if (result.error) {
          setMessage(
            result.error.status === 422
              ? 'This email address cannot be used.'
              : 'Account creation is temporarily unavailable. Try again.',
          );
          return;
        }
        router.push(`/email/pending?email=${encodeURIComponent(email)}`);
      } else if (mode === 'request-reset') {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/password/reset`,
        });
        if (result.error) {
          setMessage('The reset request could not be sent. Try again.');
          return;
        }
        setMessage('If an account exists for that address, a reset link has been sent.');
      } else {
        const result = await authClient.resetPassword({newPassword: password, token: token as string});
        if (result.error) {
          setMessage('The reset link is invalid or expired. Request a new one.');
          return;
        }
        setMessage('Your password has been updated. You can now sign in.');
      }
    } catch {
      setMessage('The authentication service could not be reached. Try again.');
    } finally {
      setPending(false);
    }
  };

  const socialSignIn = async (provider: 'github' | 'google') => {
    setPending(true);
    setMessage(undefined);
    try {
      const result = await authClient.signIn.social({
        provider,
        requestSignUp: true,
        callbackURL: `${window.location.origin}/dashboard`,
      });
      if (result.error) setMessage(`${provider === 'github' ? 'GitHub' : 'Google'} sign in is not available.`);
    } catch {
      setMessage('The authentication service could not be reached. Try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{content[mode].title}</h1>
      <form className="mt-6 space-y-4" action={submit} noValidate>
        {mode === 'sign-up' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field id="firstName" label="First name" error={fieldErrors.firstName}>
              <Input id="firstName" name="firstName" autoComplete="given-name" />
            </Field>
            <Field id="lastName" label="Last name" error={fieldErrors.lastName}>
              <Input id="lastName" name="lastName" autoComplete="family-name" />
            </Field>
          </div>
        ) : null}
        {mode !== 'reset-password' ? (
          <Field id="email" label="Email" error={fieldErrors.email}>
            <Input id="email" name="email" type="email" autoComplete="email" />
          </Field>
        ) : null}
        {mode !== 'request-reset' ? (
          <Field
            id="password"
            label={mode === 'reset-password' ? 'New password' : 'Password'}
            error={fieldErrors.password}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            />
          </Field>
        ) : null}
        {fieldErrors.form ? (
          <p role="alert" className="text-sm text-destructive">
            {fieldErrors.form}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-md bg-muted p-3 text-sm">
            {message}
          </p>
        ) : null}
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? 'Please wait…' : content[mode].submit}
        </Button>
      </form>
      {mode === 'sign-in' ? (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or continue with
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" disabled={pending} onClick={() => socialSignIn('github')}>
              GitHub
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => socialSignIn('google')}>
              Google
            </Button>
          </div>
          <div className="mt-5 flex justify-between text-sm">
            <Link className="text-primary underline-offset-4 hover:underline" href="/password/request-reset">
              Forgot password?
            </Link>
            <Link className="text-primary underline-offset-4 hover:underline" href="/sign-up">
              Create account
            </Link>
          </div>
        </>
      ) : null}
      {mode !== 'sign-in' ? (
        <p className="mt-5 text-sm text-muted-foreground">
          <Link className="text-primary underline-offset-4 hover:underline" href="/sign-in">
            Back to sign in
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function Field({id, label, error, children}: {id: string; label: string; error?: string; children: React.ReactNode}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
