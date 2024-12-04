import {type TReceiverAutocompleteOption, applyReceiverOptionsFilter} from './ReceiverAutocomplete.component';

describe('Validate if correct items are returned by filter', () => {
  const filterOptionsState = (keyword: string) => ({
    inputValue: keyword,
    getOptionLabel(option: TReceiverAutocompleteOption) {
      return option.label;
    },
  });
  const options: TReceiverAutocompleteOption[] = ['Landlord', 'McDonalds', 'State Office', 'Tax Office'].map(
    string => ({label: string, value: string}),
  );

  it('should return all partial matches', () => {
    const state = filterOptionsState('Google');
    const moreOptions: TReceiverAutocompleteOption[] = [
      ...options,
      ...['Google', 'Google Cloud', 'Google One'].map(string => ({label: string, value: string})),
    ];
    const filteredOptions = applyReceiverOptionsFilter(moreOptions, state);
    expect(filteredOptions).toEqual([
      {label: 'Google', value: 'Google'},
      {label: 'Google Cloud', value: 'Google Cloud'},
      {label: 'Google One', value: 'Google One'},
    ]);
  });

  it('filters options based on inputValue', () => {
    const state = filterOptionsState('landlord');
    const filteredOptions = applyReceiverOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(2);
    expect(filteredOptions).toEqual([
      {label: 'Create "landlord"', value: 'landlord'},
      {label: 'Landlord', value: 'Landlord'},
    ]);
  });

  it('selects exact match without creating', () => {
    const state = filterOptionsState('Landlord');
    const filteredOptions = applyReceiverOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(1);
    expect(filteredOptions).toEqual([{label: 'Landlord', value: 'Landlord'}]);
  });

  it('filters options and creates when no exact match', () => {
    const state = filterOptionsState('land');
    const filteredOptions = applyReceiverOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(2);
    expect(filteredOptions).toEqual([
      {label: 'Create "land"', value: 'land'},
      {label: 'Landlord', value: 'Landlord'},
    ]);
  });

  it('filters options and creates when no exact match (multiple partially matches)', () => {
    const state = filterOptionsState('off');
    const filteredOptions = applyReceiverOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(3);
    expect(filteredOptions).toEqual([
      {label: 'Create "off"', value: 'off'},
      {label: 'State Office', value: 'State Office'},
      {label: 'Tax Office', value: 'Tax Office'},
    ]);
  });

  it('returns all options when inputValue is empty', () => {
    const state = filterOptionsState('');
    const filteredOptions = applyReceiverOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(4);
    expect(filteredOptions).toEqual(options);
  });
});
