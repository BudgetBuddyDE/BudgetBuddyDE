import {render, screen} from '@testing-library/react';
import {CurrencyContext, LocaleContext} from '@/utils/Formatter/PreferenceContext';
import {Balance} from './Balance';

describe('Balance', () => {
  it('formats values using the active currency and locale with tabular numerals', () => {
    render(
      <LocaleContext.Provider value="de-DE">
        <CurrencyContext.Provider value="EUR">
          <Balance amount={1234.5} />
        </CurrencyContext.Provider>
      </LocaleContext.Provider>,
    );

    const balance = screen.getByText(/1\.234,50/);
    expect(balance).toHaveStyle({fontVariantNumeric: 'tabular-nums'});
  });

  it('supports explicit currency and locale overrides', () => {
    render(<Balance amount={1234.5} currency="USD" locale="en-US" />);

    expect(screen.getByText('$1,234.50')).toBeInTheDocument();
  });
});
