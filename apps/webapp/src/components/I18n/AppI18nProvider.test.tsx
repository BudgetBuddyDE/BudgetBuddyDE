import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {getMessageKey} from '@/lib/i18n/config';
import {AppI18nProvider} from './AppI18nProvider';

function Message() {
  const t = useAppTranslations();
  return <p>{t('Delete {count} transactions?', {count: 2})}</p>;
}

describe('AppI18nProvider', () => {
  it('formats English outside providers, including root error UI', () => {
    render(<Message />);
    expect(screen.getByText('Delete 2 transactions?')).toBeInTheDocument();
  });

  it('uses live next-intl messages and reacts to provider changes', () => {
    const key = getMessageKey('Delete {count} transactions?');
    const {rerender} = render(
      <AppI18nProvider messages={{[key]: 'Remove {count} entries?'}}>
        <Message />
      </AppI18nProvider>,
    );
    expect(screen.getByText('Remove 2 entries?')).toBeInTheDocument();
    rerender(
      <AppI18nProvider messages={{[key]: 'Confirm deleting {count} entries?'}}>
        <Message />
      </AppI18nProvider>,
    );
    expect(screen.getByText('Confirm deleting 2 entries?')).toBeInTheDocument();
  });
});
