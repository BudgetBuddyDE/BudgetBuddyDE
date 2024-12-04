import {
  type TPaymentMethodAutocompleteOption,
  applyPaymentMethodOptionsFilter,
} from './PaymentMethodAutocomplete.component';

/**
 * Provided options
 * Cash, Credit Card, Debit
 *
 * Cases
 * Cash => Cash
 */
describe('Validate if correct items are returned by filter', () => {
  const filterOptionsState = (keyword: string) => ({
    inputValue: keyword,
    getOptionLabel(option: TPaymentMethodAutocompleteOption) {
      return option.label;
    },
  });
  const options: TPaymentMethodAutocompleteOption[] = [
    {label: 'Cash', id: '1'},
    {label: 'Credit Card', id: '2'},
    {label: 'Debit', id: '3'},
  ];
  it('filters options based on inputValue', () => {
    const state = filterOptionsState('cash');
    const filteredOptions = applyPaymentMethodOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(1);
    expect(filteredOptions).toEqual([{label: 'Cash', id: '1'}] as TPaymentMethodAutocompleteOption[]);
  });
  it('selects exact match without creating', () => {
    const state = filterOptionsState('Cash');
    const filteredOptions = applyPaymentMethodOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(1);
    expect(filteredOptions).toEqual([{label: 'Cash', id: '1'}] as TPaymentMethodAutocompleteOption[]);
  });
  it('returns all options when inputValue is empty', () => {
    const state = filterOptionsState('');
    const filteredOptions = applyPaymentMethodOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(3);
    expect(filteredOptions).toEqual(options);
  });
});
