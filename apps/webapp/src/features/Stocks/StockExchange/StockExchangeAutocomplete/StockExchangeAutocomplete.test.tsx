import {FilterOptionsState} from '@mui/material';

import {
  type TStockExchangeAutocompleteOption,
  applyStockExchangeOptionsFilter,
} from './StockExchangeAutocomplete.component';

describe('Validate if correct items are returned by filter', () => {
  const filterState: (keyword: string) => FilterOptionsState<TStockExchangeAutocompleteOption> = keyword => ({
    inputValue: keyword,
    getOptionLabel(option: TStockExchangeAutocompleteOption): string {
      return option.label;
    },
  });

  const options: TStockExchangeAutocompleteOption[] = [
    {
      value: 'stoyr8qqb85jlmk',
      label: 'Lang & Schwarz Exchange',
      ticker: 'LSX',
    },
    {
      value: 'c1ry6z1wmhgcd9l',
      label: 'Gettex',
      ticker: 'GTX',
    },
    {
      value: 'g05abavpc44x7hu',
      label: 'XETRA',
      ticker: 'ETR',
    },
    {
      value: 'jld28gwxuq3wm24',
      label: 'Tradegate Exchange',
      ticker: 'tradegate',
    },
    {
      value: 'u7gleht6mlmiz5u',
      label: 'Börse Hamburg',
      ticker: 'HM',
    },
    {
      value: '63a0fexin2njr5h',
      label: 'Börse Frankfurt',
      ticker: 'F',
    },
    {
      value: 'by48a6z6lhu57cv',
      label: 'Börse Düsesldorf',
      ticker: 'DU',
    },
  ];

  it('filters options based on inputValue', () => {
    const state = filterState('gettex');
    const filteredOptions = applyStockExchangeOptionsFilter(options, state);
    expect(filteredOptions).toEqual([
      {
        value: 'c1ry6z1wmhgcd9l',
        label: 'Gettex',
        ticker: 'GTX',
      },
    ]);
  });

  it('returns exchange by ticker', () => {
    const state = filterState('LSX');
    const filteredOptions = applyStockExchangeOptionsFilter(options, state);
    expect(filteredOptions).toEqual([
      {
        value: 'stoyr8qqb85jlmk',
        label: 'Lang & Schwarz Exchange',
        ticker: 'LSX',
      },
    ]);
  });

  it('should return all partial matches', () => {
    const state = filterState('Börse');
    const filteredOptions = applyStockExchangeOptionsFilter(options, state);
    expect(filteredOptions).toEqual([
      {
        value: 'u7gleht6mlmiz5u',
        label: 'Börse Hamburg',
        ticker: 'HM',
      },
      {
        value: '63a0fexin2njr5h',
        label: 'Börse Frankfurt',
        ticker: 'F',
      },
      {
        value: 'by48a6z6lhu57cv',
        label: 'Börse Düsesldorf',
        ticker: 'DU',
      },
    ]);
  });

  it("should return an empty array if there's no match", () => {
    const state = filterState('abc');
    const filteredOptions = applyStockExchangeOptionsFilter(options, state);
    expect(filteredOptions).toEqual([]);
  });
});
