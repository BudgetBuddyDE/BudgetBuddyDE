'use client';

import {ArrowRight, Check, Github, LockKeyhole, ShieldCheck, Sparkles} from 'lucide-react';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {authClient} from '@/authClient';
import {BrandLogo} from '@/components/brand-logo';
import {Button, PasswordField, TextField} from '@/components/ui/primitives';
import {useI18n} from '@/lib/i18n';

export type AuthMode = 'sign-in' | 'sign-up' | 'request-reset' | 'reset-password';

interface AuthValues {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function createAuthSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    email: z.email(t('auth.validation.email')).optional(),
    password: z.string().min(8, t('auth.validation.passwordLength')).optional(),
    confirmPassword: z.string().optional(),
  });
}

const COPY_KEYS: Record<AuthMode, {eyebrow: string; title: string; description: string; submit: string}> = {
  'sign-in': {
    eyebrow: 'auth.signIn.eyebrow',
    title: 'auth.signIn.title',
    description: 'auth.signIn.description',
    submit: 'auth.signIn.submit',
  },
  'sign-up': {
    eyebrow: 'auth.signUp.eyebrow',
    title: 'auth.signUp.title',
    description: 'auth.signUp.description',
    submit: 'auth.signUp.submit',
  },
  'request-reset': {
    eyebrow: 'auth.requestReset.eyebrow',
    title: 'auth.requestReset.title',
    description: 'auth.requestReset.description',
    submit: 'auth.requestReset.submit',
  },
  'reset-password': {
    eyebrow: 'auth.reset.eyebrow',
    title: 'auth.reset.title',
    description: 'auth.reset.description',
    submit: 'auth.reset.submit',
  },
};

export function AuthForm({mode}: {mode: AuthMode}) {
  const {t} = useI18n();
  const authSchema = useMemo(() => createAuthSchema(t), [t]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<AuthValues>();
  const copyKeys = COPY_KEYS[mode];
  const copy = {
    eyebrow: t(copyKeys.eyebrow),
    title: t(copyKeys.title),
    description: t(copyKeys.description),
    submit: t(copyKeys.submit),
  };

  const submit = async (values: AuthValues) => {
    setServiceError(null);
    setSuccess(null);
    const parsed = authSchema.safeParse(values);
    if (!parsed.success) {
      setServiceError(parsed.error.issues[0]?.message ?? t('auth.validation.details'));
      return;
    }
    if ((mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') && !values.password) {
      setServiceError(t('auth.validation.passwordRequired'));
      return;
    }
    if ((mode === 'sign-in' || mode === 'sign-up' || mode === 'request-reset') && !values.email) {
      setServiceError(t('auth.validation.emailRequired'));
      return;
    }
    if (mode === 'sign-up' && (!values.firstName || !values.lastName)) {
      setServiceError(t('auth.validation.nameRequired'));
      return;
    }
    if (mode === 'reset-password' && values.password !== values.confirmPassword) {
      setServiceError(t('auth.validation.passwordMismatch'));
      return;
    }

    if (mode === 'sign-in') {
      const {error} = await authClient.signIn.email({
        email: values.email!,
        password: values.password!,
        callbackURL: '/dashboard',
      });
      if (error) {
        setServiceError(error.message ?? t('auth.error.signIn'));
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
        setServiceError(error.message ?? t('auth.error.signUp'));
        return;
      }
      setSuccess(t('auth.success.signUp'));
    } else if (mode === 'request-reset') {
      const {error} = await authClient.requestPasswordReset({
        email: values.email!,
        redirectTo: `${window.location.origin}/password/reset`,
      });
      if (error) {
        setServiceError(error.message ?? t('auth.error.resetRequest'));
        return;
      }
      setSuccess(t('auth.success.resetRequest'));
    } else {
      const token = searchParams.get('token');
      if (!token) {
        setServiceError(t('auth.error.resetToken'));
        return;
      }
      const {error} = await authClient.resetPassword({newPassword: values.password!, token});
      if (error) {
        setServiceError(error.message ?? t('auth.error.resetPassword'));
        return;
      }
      setSuccess(t('auth.success.resetPassword'));
    }
  };

  const socialSignIn = async (provider: 'google' | 'github') => {
    setServiceError(null);
    const {error} = await authClient.signIn.social({provider, callbackURL: '/dashboard'});
    if (error) setServiceError(error.message ?? t('auth.error.social', {provider}));
  };

  return (
    <div className="auth-card">
      <BrandLogo className="auth-mobile-brand" />
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="auth-description">{copy.description}</p>
      {(mode === 'sign-in' || mode === 'sign-up') && (
        <div className="social-grid">
          <Button variant="secondary" onClick={() => void socialSignIn('google')}>
            <span className="google-g">G</span> {t('auth.google')}
          </Button>
          <Button variant="secondary" onClick={() => void socialSignIn('github')}>
            <Github size={17} /> {t('auth.github')}
          </Button>
        </div>
      )}
      {(mode === 'sign-in' || mode === 'sign-up') && (
        <div className="auth-divider">
          <span>{t('auth.continueEmail')}</span>
        </div>
      )}
      <form className="auth-form" onSubmit={event => void handleSubmit(submit)(event)} noValidate>
        {mode === 'sign-up' && (
          <div className="form-grid two">
            <TextField
              label={t('auth.firstName')}
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <TextField
              label={t('auth.lastName')}
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
        )}
        {mode !== 'reset-password' && (
          <TextField
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        )}
        {(mode === 'sign-in' || mode === 'sign-up' || mode === 'reset-password') && (
          <PasswordField
            label={mode === 'reset-password' ? t('auth.newPassword') : t('auth.password')}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            hint={mode !== 'sign-in' ? t('auth.passwordHint') : undefined}
            error={errors.password?.message}
            {...register('password')}
          />
        )}
        {mode === 'reset-password' && (
          <PasswordField
            label={t('auth.confirmPassword')}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        )}
        {mode === 'sign-in' && (
          <div className="forgot-row">
            <label>
              <input type="checkbox" /> {t('auth.keepSignedIn')}
            </label>
            <Link href="/password/request-reset">{t('auth.forgotPassword')}</Link>
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
          {isSubmitting ? t('auth.wait') : copy.submit}
          <ArrowRight size={17} />
        </Button>
      </form>
      <p className="auth-switch">
        {mode === 'sign-in' ? (
          <>
            {t('auth.newUser')} <Link href="/sign-up">{t('auth.createAccount')}</Link>
          </>
        ) : mode === 'sign-up' ? (
          <>
            {t('auth.existingUser')} <Link href="/sign-in">{t('auth.signIn.submit')}</Link>
          </>
        ) : (
          <>
            {t('auth.rememberedPassword')} <Link href="/sign-in">{t('auth.backToSignIn')}</Link>
          </>
        )}
      </p>
      <p className="auth-security">
        <LockKeyhole size={14} /> {t('auth.security')}
      </p>
    </div>
  );
}

export function AuthVisual() {
  const {t, formatCurrency} = useI18n();
  return (
    <aside className="auth-visual">
      <div className="auth-brand">
        <BrandLogo onDark />
      </div>
      <div className="auth-quote">
        <span className="quote-icon">
          <Sparkles size={20} />
        </span>
        <blockquote>{t('auth.visual.quote')}</blockquote>
        <p>{t('auth.visual.quoteCaption')}</p>
      </div>
      <div className="auth-preview">
        <div className="preview-top">
          <span>{t('auth.visual.monthlyOverview')}</span>
          <span>•••</span>
        </div>
        <strong>{formatCurrency(4286.4)}</strong>
        <small>{t('auth.visual.availableBalance')}</small>
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
            <small>{t('auth.visual.income')}</small>
            <strong>{formatCurrency(5420)}</strong>
          </span>
          <span>
            <small>{t('auth.visual.expenses')}</small>
            <strong>{formatCurrency(1134)}</strong>
          </span>
        </div>
      </div>
      <div className="auth-trust">
        <span>
          <Check size={15} /> {t('auth.visual.private')}
        </span>
        <span>
          <Check size={15} /> {t('auth.visual.selfHosting')}
        </span>
      </div>
    </aside>
  );
}
