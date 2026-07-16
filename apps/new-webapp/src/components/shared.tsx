import {AlertTriangle, CheckCircle2, Inbox, LoaderCircle, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/primitives';

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
  const content = {
    loading: {
      icon: <LoaderCircle className="spin" aria-hidden="true" />,
      title: title ?? 'Loading your finance data',
      description: description ?? 'This usually takes only a moment.',
    },
    empty: {
      icon: <Inbox aria-hidden="true" />,
      title: title ?? 'Nothing here yet',
      description: description ?? 'Create your first item to get started.',
    },
    error: {
      icon: <AlertTriangle aria-hidden="true" />,
      title: title ?? 'We could not load this area',
      description: description ?? 'Your data is safe. Try the request again.',
    },
    success: {
      icon: <CheckCircle2 aria-hidden="true" />,
      title: title ?? 'All done',
      description: description ?? 'Your changes were saved.',
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
          <RefreshCw size={15} /> Retry
        </Button>
      )}
    </div>
  );
}

export function SkeletonRows({count = 5}: {count?: number}) {
  return (
    <div className="skeleton-list" aria-label="Loading content">
      {Array.from({length: count}, (_, index) => (
        <span key={index} className="skeleton-row" />
      ))}
    </div>
  );
}
