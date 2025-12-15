import {renderHook} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {usePagination} from './usePagination.hook';

describe('usePagination', () => {
  const testData = [
    {id: 1, name: 'Item 1'},
    {id: 2, name: 'Item 2'},
    {id: 3, name: 'Item 3'},
    {id: 4, name: 'Item 4'},
    {id: 5, name: 'Item 5'},
  ];

  it('should return the correct page content', () => {
    const state = {page: 1, rowsPerPage: 2};
    const {result} = renderHook(() => usePagination(testData, state));
    expect(result.current).toEqual([
      {id: 3, name: 'Item 3'},
      {id: 4, name: 'Item 4'},
    ]);
  });

  it('should throw an error when provided data is not an array', () => {
    const state = {page: 0, rowsPerPage: 10};
    const invalidData = {some: 'data'};
    expect(() => usePagination(invalidData, state)).toThrowError('Provided data has to be an array');
  });
});
