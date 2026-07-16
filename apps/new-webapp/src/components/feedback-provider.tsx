'use client';

import {X} from 'lucide-react';
import {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {IconButton} from '@/components/ui/primitives';
import {useI18n} from '@/lib/i18n';

export type ToastTone = 'success' | 'error' | 'info';
export interface ToastInput {
  message: string;
  tone?: ToastTone;
  duration?: number;
}
interface ToastRecord extends Required<ToastInput> {
  id: number;
}
interface FeedbackContextValue {
  showToast: (toast: ToastInput) => number;
  dismissToast: (id: number) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({children}: {children: React.ReactNode}) {
  const {t} = useI18n();
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({message, tone = 'info', duration = 4200}: ToastInput) => {
      const id = nextId.current++;
      setToasts(current => [...current, {id, message, tone, duration}]);
      if (duration > 0) {
        const timer = window.setTimeout(() => dismissToast(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(() => ({showToast, dismissToast}), [dismissToast, showToast]);
  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        className="toast-viewport"
        aria-label={t('feedback.notifications')}
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.tone}`}
            role={toast.tone === 'error' ? 'alert' : 'status'}
          >
            <span>{toast.message}</span>
            <IconButton aria-label={t('feedback.dismiss')} onClick={() => dismissToast(toast.id)}>
              <X size={15} aria-hidden="true" />
            </IconButton>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback must be used inside FeedbackProvider.');
  return value;
}
