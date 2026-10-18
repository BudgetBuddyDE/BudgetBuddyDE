import {render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {AppI18nProvider} from './AppI18nProvider';

function Message() {
  const t = useAppTranslations();
  return <p>{t('common.noResultsForQuery', {query: 'Sam'})}</p>;
}

function ErrorMessage() {
  const t = useAppTranslations();
  return <p>{t('errors.oops')}</p>;
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

  it('renders the German catalog on the server before any effects run', () => {
    expect(
      renderToString(
        <AppI18nProvider locale="de-DE">
          <ErrorMessage />
        </AppI18nProvider>,
      ),
    ).toBe('<p>Hoppla!</p>');
  });

  it('switches locale catalogs immediately without supplied messages', () => {
    const {rerender} = render(
      <AppI18nProvider locale="en-US">
        <ErrorMessage />
      </AppI18nProvider>,
    );
    expect(screen.getByText('Ooops!')).toBeInTheDocument();

    rerender(
      <AppI18nProvider locale="de-DE">
        <ErrorMessage />
      </AppI18nProvider>,
    );
    expect(screen.getByText('Hoppla!')).toBeInTheDocument();

    rerender(
      <AppI18nProvider locale="en-US">
        <ErrorMessage />
      </AppI18nProvider>,
    );
    expect(screen.getByText('Ooops!')).toBeInTheDocument();
  });
});
