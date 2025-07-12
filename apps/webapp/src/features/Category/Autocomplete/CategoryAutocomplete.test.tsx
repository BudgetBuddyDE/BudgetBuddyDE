import {type TCategoryAutocompleteOption, applyCategoryOptionsFilter} from './CategoryAutocomplete.component';

/**
 * Provided options
 * Work, Rent, Other, Office, Offgrid
 *
 * Cases
 * Work => Work
 */
describe('Validate if correct items are returned by filter', () => {
  const filterOptionsState = (keyword: string) => ({
    inputValue: keyword,
    getOptionLabel(option: TCategoryAutocompleteOption) {
      return option.name;
    },
  });
  const options: TCategoryAutocompleteOption[] = [
    {name: 'Work', ID: '1'},
    {name: 'Rent', ID: '2'},
    {name: 'Other', ID: '3'},
    {name: 'Office', ID: '4'},
    {name: 'Offgrid', ID: '5'},
  ];
  it('filters options based on inputValue', () => {
    const state = filterOptionsState('work');
    const filteredOptions = applyCategoryOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(1);
    expect(filteredOptions).toEqual([{name: 'Work', ID: '1'}] as TCategoryAutocompleteOption[]);
  });
  it('selects exact match without creating', () => {
    const state = filterOptionsState('Rent');
    const filteredOptions = applyCategoryOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(1);
    expect(filteredOptions).toEqual([{name: 'Rent', ID: '2'}] as TCategoryAutocompleteOption[]);
  });
  it('returns all options when inputValue is empty', () => {
    const state = filterOptionsState('');
    const filteredOptions = applyCategoryOptionsFilter(options, state);
    expect(filteredOptions.length).toBe(5);
    expect(filteredOptions).toEqual(options);
  });
});
