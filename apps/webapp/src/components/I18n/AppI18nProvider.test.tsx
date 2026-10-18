import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {AppI18nProvider} from './AppI18nProvider';

function Message() {
  const t = useAppTranslations();
  return <p>{t('common.noResultsForQuery', {query: 'Sam'})}</p>;
}

describe('AppI18nProvider', () => {
  it('provides the standalone English semantic translator', () => {
    render(<Message />);
    expect(screen.getByText('No results for "Sam"')).toBeInTheDocument();
  });

  it('uses supplied nested messages', () => {
    render(
      <AppI18nProvider messages={{common: {noResultsForQuery: 'No entries match "{query}"'}}}>
        <Message />
      </AppI18nProvider>,
    );
    expect(screen.getByText('No entries match "Sam"')).toBeInTheDocument();
  });
});
