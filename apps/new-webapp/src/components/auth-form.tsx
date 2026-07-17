'use client';

import {ArrowRight, Check, Github, Gauge, LockKeyhole, ShieldCheck, Sparkles} from 'lucide-react';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {authClient} from '@/authClient';
import {Button, PasswordField, TextField} from '@/components/ui/primitives';

export type AuthMode = 'sign-in' | 'sign-up' | 'request-reset' | 'reset-password';

const authSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.email('Enter a valid email address.').optional(),
  password: z.string().min(8, 'Use at least 8 characters.').optional(),
  confirmPassword: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;

const COPY: Record<AuthMode, {eyebrow: string; title: string; description: string; submit: string}> = {
  'sign-in': {
    eyebrow: 'Welcome back',
    title: 'Sign in to your workspace',
    description: 'Continue where you left off and keep your month on track.',
    submit: 'Sign in',
  },
  'sign-up': {
    eyebrow: 'Create your account',
    title: 'Start with financial clarity',
    description: 'A calm, private workspace for the money decisions that matter.',
    submit: 'Create account',
  },
  'request-reset': {
    eyebrow: 'Account recovery',
    title: 'Reset your password',
    description: 'We will send a secure reset link to your verified email address.',
    submit: 'Send reset link',
  },
  'reset-password': {
    eyebrow: 'Choose a password',
    title: 'Secure your account',
    description: 'Use at least eight characters and avoid a password used elsewhere.',
    submit: 'Save new password',
  },
};

export function AuthForm({mode}: {mode: AuthMode}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<AuthValues>();
  const copy = COPY[mode];

  const submit = async (values: AuthValues) => {
    setServiceError(null);
    setSuccess(null);
    const parsed = authSchema.safeParse(values);
    if (!parsed.success) {
      setServiceError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    if ((mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') && !values.password) {
      setServiceError('Enter your password.');
      return;
    }
    if ((mode === 'sign-in' || mode === 'sign-up' || mode === 'request-reset') && !values.email) {
      setServiceError('Enter your email address.');
      return;
    }
    if (mode === 'sign-up' && (!values.firstName || !values.lastName)) {
      setServiceError('Enter your first and last name.');
      return;
    }
    if (mode === 'reset-password' && values.password !== values.confirmPassword) {
      setServiceError('The passwords do not match.');
      return;
    }

    if (mode === 'sign-in') {
      const {error} = await authClient.signIn.email({
        email: values.email!,
        password: values.password!,
        callbackURL: '/dashboard',
      });
      if (error) {
        setServiceError(error.message ?? 'Sign-in failed. Check your details.');
        return;
      }
      router.replace('/dashboard');
    } else if (mode === 'sign-up') {
      const {error} = await authClient.signUp.email({
        name: `${values.firstName} ${values.lastName}`,
        email: values.email!,
        password: values.password!,
        callbackURL: '/dashboard',
      });
      if (error) {
        setServiceError(error.message ?? 'Your account could not be created.');
        return;
      }
      setSuccess('Account created. Check your inbox to verify your email.');
    } else if (mode === 'request-reset') {
      const {error} = await authClient.requestPasswordReset({
        email: values.email!,
        redirectTo: `${window.location.origin}/password/reset`,
      });
      if (error) {
        setServiceError(error.message ?? 'The reset email could not be sent.');
        return;
      }
      setSuccess('If an account exists for this address, a reset link is on its way.');
    } else {
      const token = searchParams.get('token');
      if (!token) {
        setServiceError('This reset link is incomplete or has expired.');
        return;
      }
      const {error} = await authClient.resetPassword({newPassword: values.password!, token});
      if (error) {
        setServiceError(error.message ?? 'The password could not be changed.');
        return;
      }
      setSuccess('Password updated. You can now sign in.');
    }
  };

  const socialSignIn = async (provider: 'google' | 'github') => {
    setServiceError(null);
    const {error} = await authClient.signIn.social({provider, callbackURL: '/dashboard'});
    if (error) setServiceError(error.message ?? `Could not continue with ${provider}.`);
  };

  return (
    <div className="auth-card">
      <div className="auth-mobile-brand">
        <Gauge size={22} />
        <strong>BudgetBuddy</strong>
      </div>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="auth-description">{copy.description}</p>
      {(mode === 'sign-in' || mode === 'sign-up') && (
        <div className="social-grid">
          <Button variant="secondary" onClick={() => void socialSignIn('google')}>
            <span className="google-g">G</span> Google
          </Button>
          <Button variant="secondary" onClick={() => void socialSignIn('github')}>
            <Github size={17} /> GitHub
          </Button>
        </div>
      )}
      {(mode === 'sign-in' || mode === 'sign-up') && (
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>
      )}
      <form className="auth-form" onSubmit={event => void handleSubmit(submit)(event)} noValidate>
        {mode === 'sign-up' && (
          <div className="form-grid two">
            <TextField
              label="First name"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <TextField
              label="Last name"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
        )}
        {mode !== 'reset-password' && (
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        )}
        {(mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') && (
          <PasswordField
            label={mode === 'reset-password' ? 'New password' : 'Password'}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            hint={mode !== 'sign-in' ? 'At least 8 characters' : undefined}
            error={errors.password?.message}
            {...register('password')}
          />
        )}
        {mode === 'reset-password' && (
          <PasswordField label="Confirm password" autoComplete="new-password" {...register('confirmPassword')} />
        )}
        {mode === 'sign-in' && (
          <div className="forgot-row">
            <label>
              <input type="checkbox" /> Keep me signed in
            </label>
            <Link href="/password/request-reset">Forgot password?</Link>
          </div>
        )}
        {serviceError && (
          <div className="auth-message error" role="alert">
            <ShieldCheck size={17} />
            {serviceError}
          </div>
        )}
        {success && (
          <div className="auth-message success" role="status">
            <Check size={17} />
            {success}
          </div>
        )}
        <Button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait…' : copy.submit}
          <ArrowRight size={17} />
        </Button>
      </form>
      <p className="auth-switch">
        {mode === 'sign-in' ? (
          <>
            New to BudgetBuddy? <Link href="/sign-up">Create an account</Link>
          </>
        ) : mode === 'sign-up' ? (
          <>
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </>
        ) : (
          <>
            Remembered your password? <Link href="/sign-in">Back to sign in</Link>
          </>
        )}
      </p>
      <p className="auth-security">
        <LockKeyhole size={14} /> Encrypted connection · Your data stays private
      </p>
    </div>
  );
}

export function AuthVisual() {
  return (
    <aside className="auth-visual">
      <div className="auth-brand">
        <span className="brand-mark">
          <Gauge size={22} />
        </span>
        <div>
          <strong>BudgetBuddy</strong>
          <small>Finance workspace</small>
        </div>
      </div>
      <div className="auth-quote">
        <span className="quote-icon">
          <Sparkles size={20} />
        </span>
        <blockquote>“The best budget is the one you can understand at a glance.”</blockquote>
        <p>Build clarity, one month at a time.</p>
      </div>
      <div className="auth-preview">
        <div className="preview-top">
          <span>Monthly overview</span>
          <span>•••</span>
        </div>
        <strong>€4,286.40</strong>
        <small>Available balance</small>
        <div className="preview-bars">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="preview-stats">
          <span>
            <small>Income</small>
            <strong>€5,420</strong>
          </span>
          <span>
            <small>Expenses</small>
            <strong>€1,134</strong>
          </span>
        </div>
      </div>
      <div className="auth-trust">
        <span>
          <Check size={15} /> Private by design
        </span>
        <span>
          <Check size={15} /> Built for self-hosting
        </span>
      </div>
    </aside>
  );
}
