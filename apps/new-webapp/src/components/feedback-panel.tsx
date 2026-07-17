import {AlertCircle, CheckCircle2, Inbox, LoaderCircle} from 'lucide-react';
import type {ReactNode} from 'react';
import {cn} from '@/utils/cn';

export type FeedbackKind = 'loading' | 'empty' | 'error' | 'success';

interface FeedbackPanelProps {
  kind: FeedbackKind;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

const icons = {
  loading: LoaderCircle,
  empty: Inbox,
  error: AlertCircle,
  success: CheckCircle2,
};

export function FeedbackPanel({kind, title, description, action, compact = false}: FeedbackPanelProps) {
  const Icon = icons[kind];
  return (
    <section
      role={kind === 'error' ? 'alert' : kind === 'loading' ? 'status' : undefined}
      aria-live={kind === 'loading' || kind === 'success' ? 'polite' : undefined}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border bg-card text-center',
        compact ? 'gap-2 p-4' : 'gap-3 p-8',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'size-5',
          kind === 'loading' && 'animate-spin',
          kind === 'error' && 'text-destructive',
          kind === 'success' && 'text-success',
        )}
      />
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </section>
  );
}
