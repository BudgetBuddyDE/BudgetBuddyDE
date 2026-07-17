'use client';

import {AlertTriangle, CheckCircle2, Inbox, LoaderCircle, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/primitives';
import {useI18n} from '@/lib/i18n';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}

export function StatePanel({
  state,
  title,
  description,
  onRetry,
}: {
  state: 'loading' | 'empty' | 'error' | 'success';
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const {t} = useI18n();
  const content = {
    loading: {
      icon: <LoaderCircle className="spin" aria-hidden="true" />,
      title: title ?? t('state.loading.title'),
      description: description ?? t('state.loading.description'),
    },
    empty: {
      icon: <Inbox aria-hidden="true" />,
      title: title ?? t('state.empty.title'),
      description: description ?? t('state.empty.description'),
    },
    error: {
      icon: <AlertTriangle aria-hidden="true" />,
      title: title ?? t('state.error.title'),
      description: description ?? t('state.error.description'),
    },
    success: {
      icon: <CheckCircle2 aria-hidden="true" />,
      title: title ?? t('state.success.title'),
      description: description ?? t('state.success.description'),
    },
  }[state];

  return (
    <div className={`state-panel state-${state}`} role={state === 'error' ? 'alert' : 'status'}>
      <span className="state-icon">{content.icon}</span>
      <div>
        <strong>{content.title}</strong>
        <p>{content.description}</p>
      </div>
      {state === 'error' && onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={15} /> {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export function SkeletonRows({count = 5}: {count?: number}) {
  const {t} = useI18n();
  return (
    <div className="skeleton-list" aria-label={t('common.loadingContent')}>
      {Array.from({length: count}, (_, index) => (
        <span key={index} className="skeleton-row" />
      ))}
    </div>
  );
}
