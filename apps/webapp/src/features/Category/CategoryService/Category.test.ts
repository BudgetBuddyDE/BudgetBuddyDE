import {type TCategory, type TTransaction} from '@budgetbuddyde/types';
import {subDays} from 'date-fns';

import {type TCategoryAutocompleteOption} from '../Autocomplete';
import {CategoryService} from './Category.service';

describe('sortAutocompleteOptionsByTransactionUsage', () => {
  it('should return an empty array if categories is empty', () => {
    const categories: TCategory[] = [];
    const transactions: TTransaction[] = [];
    const result = CategoryService.sortAutocompleteOptionsByTransactionUsage(categories, transactions);
    expect(result).toEqual([]);
  });

  it('should return autocomplete options sorted by transaction usage', () => {
    const categories = [
      {id: '1', name: 'Category 1'},
      {id: '2', name: 'Category 2'},
      {id: '3', name: 'Category 3'},
    ] as TCategory[];
    const transactions = [
      {expand: {category: categories[0]}, processed_at: new Date()},
      {expand: {category: categories[1]}, processed_at: new Date()},
      {expand: {category: categories[0]}, processed_at: new Date()},
      {expand: {category: categories[2]}, processed_at: new Date()},
    ] as TTransaction[];
    const result = CategoryService.sortAutocompleteOptionsByTransactionUsage(categories, transactions);

    const expected: TCategoryAutocompleteOption[] = [
      {id: '1', label: 'Category 1'},
      {id: '2', label: 'Category 2'},
      {id: '3', label: 'Category 3'},
    ];
    expect(result).toEqual(expected);
  });

  it('should return autocomplete options sorted by transaction usage within the specified days', () => {
    const categories = [
      {id: '1', name: 'Category 1'},
      {id: '2', name: 'Category 2'},
      {id: '3', name: 'Category 3'},
    ] as TCategory[];
    const transactions = [
      {expand: {category: categories[0]}, processed_at: subDays(new Date(), 10)},
      {expand: {category: categories[1]}, processed_at: subDays(new Date(), 20)},
      {expand: {category: categories[0]}, processed_at: subDays(new Date(), 5)},
      {expand: {category: categories[2]}, processed_at: subDays(new Date(), 15)},
    ] as TTransaction[];
    const result = CategoryService.sortAutocompleteOptionsByTransactionUsage(categories, transactions, 15);

    const expected: TCategoryAutocompleteOption[] = [
      {id: '1', label: 'Category 1'},
      {id: '3', label: 'Category 3'},
      {id: '2', label: 'Category 2'},
    ];
    expect(result).toEqual(expected);
  });

  it('should return autocomplete options sorted by transaction usage with default days', () => {
    const categories = [
      {id: '1', name: 'Category 1'},
      {id: '2', name: 'Category 2'},
      {id: '3', name: 'Category 3'},
    ] as TCategory[];
    const transactions = [
      {expand: {category: categories[0]}, processed_at: subDays(new Date(), 10)},
      {expand: {category: categories[2]}, processed_at: subDays(new Date(), 20)},
      {expand: {category: categories[0]}, processed_at: subDays(new Date(), 5)},
      {expand: {category: categories[1]}, processed_at: subDays(new Date(), 15)},
      {expand: {category: categories[2]}, processed_at: subDays(new Date(), 31)},
      {expand: {category: categories[2]}, processed_at: subDays(new Date(), 31)},
    ] as TTransaction[];
    const result = CategoryService.sortAutocompleteOptionsByTransactionUsage(categories, transactions);

    const expected: TCategoryAutocompleteOption[] = [
      {id: '1', label: 'Category 1'},
      {id: '2', label: 'Category 2'},
      {id: '3', label: 'Category 3'},
    ];
    expect(result).toEqual(expected);
  });
});
describe('filter', () => {
  it('should return an empty array if categories is empty', () => {
    const categories: TCategory[] = [];
    const keyword = 'test';
    const result = CategoryService.filter(categories, keyword);
    expect(result).toEqual([]);
  });

  it('should return categories that match the keyword', () => {
    const categories = [
      {id: '1', name: 'Category 1', description: 'Description 1'},
      {id: '2', name: 'Category 2', description: 'Description 2'},
      {id: '3', name: 'Category 3', description: 'Description 3'},
    ] as TCategory[];
    const keyword = 'category';
    const result = CategoryService.filter(categories, keyword);
    const expected = [
      {id: '1', name: 'Category 1', description: 'Description 1'},
      {id: '2', name: 'Category 2', description: 'Description 2'},
      {id: '3', name: 'Category 3', description: 'Description 3'},
    ];
    expect(result).toEqual(expected);
  });

  it('should return categories that match the keyword case-insensitively', () => {
    const categories = [
      {id: '1', name: 'Category 1', description: 'Description 1'},
      {id: '2', name: 'Category 2', description: 'Description 2'},
      {id: '3', name: 'Category 3', description: 'Description 3'},
    ] as TCategory[];
    const keyword = 'CATEGORY';
    const result = CategoryService.filter(categories, keyword);
    const expected = [
      {id: '1', name: 'Category 1', description: 'Description 1'},
      {id: '2', name: 'Category 2', description: 'Description 2'},
      {id: '3', name: 'Category 3', description: 'Description 3'},
    ];
    expect(result).toEqual(expected);
  });

  it('should return categories that match the keyword in name or description', () => {
    const categories = [
      {id: '1', name: 'Category 1', description: 'Description 1'},
      {id: '2', name: 'Category 2', description: 'Description 2'},
      {id: '3', name: 'Category 3', description: 'Description 3'},
    ] as TCategory[];
    const keyword = 'description';
    const result = CategoryService.filter(categories, keyword);
    const expected = [
      {id: '1', name: 'Category 1', description: 'Description 1'},
      {id: '2', name: 'Category 2', description: 'Description 2'},
      {id: '3', name: 'Category 3', description: 'Description 3'},
    ];
    expect(result).toEqual(expected);
  });

  it('should return an empty array if no categories match the keyword', () => {
    const categories = [
      {id: '1', name: 'Category 1', description: 'Description 1'},
      {id: '2', name: 'Category 2', description: 'Description 2'},
      {id: '3', name: 'Category 3', description: 'Description 3'},
    ] as TCategory[];
    const keyword = 'test';
    const result = CategoryService.filter(categories, keyword);
    expect(result).toEqual([]);
  });
});
