import {describe, expect, it} from 'vitest';
import {DEFAULT_TABLE_PAGE_SIZE, parseMultiValue, parsePageSize, updateTableSearchParams} from './table-state';

describe('table URL state', () => {
  it('parses supported page sizes and safely falls back', () => {
    expect(parsePageSize('25')).toBe(25);
    expect(parsePageSize('100')).toBe(100);
    expect(parsePageSize('15')).toBe(DEFAULT_TABLE_PAGE_SIZE);
    expect(parsePageSize('broken')).toBe(DEFAULT_TABLE_PAGE_SIZE);
  });

  it('restores repeated and legacy comma-separated multi-values without duplicates', () => {
    const query = new URLSearchParams('category=a&category=b,c&category=a');
    expect(parseMultiValue(query, 'category')).toEqual(['a', 'b', 'c']);
  });

  it('updates only changed dimensions and serializes arrays as repeated parameters', () => {
    const query = updateTableSearchParams(new URLSearchParams('method=m1&page=3&q=lunch'), {
      category: ['c1', 'c2'],
      page: null,
    });
    expect(query.getAll('category')).toEqual(['c1', 'c2']);
    expect(query.get('method')).toBe('m1');
    expect(query.get('q')).toBe('lunch');
    expect(query.has('page')).toBe(false);
  });
});
