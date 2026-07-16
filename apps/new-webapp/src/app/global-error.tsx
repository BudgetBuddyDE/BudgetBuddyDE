'use client';

import {Button} from '@/components/ui/primitives';
import {I18nProvider, useI18n} from '@/lib/i18n';

function ErrorContent({reset}: {reset: () => void}) {
  const {t} = useI18n();
  return (
    <main className="fatal-error">
      <p className="eyebrow">{t('globalError.eyebrow')}</p>
      <h1>{t('globalError.title')}</h1>
      <p>{t('globalError.description')}</p>
      <Button onClick={reset}>{t('globalError.reload')}</Button>
    </main>
  );
}

export default function GlobalError({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <ErrorContent reset={reset} />
        </I18nProvider>
      </body>
    </html>
  );
}
