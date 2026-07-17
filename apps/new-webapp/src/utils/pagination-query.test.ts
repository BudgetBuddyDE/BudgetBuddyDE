import {describe, expect, it} from 'vitest';
import {parseListQuery} from './pagination-query';

describe('parseListQuery', () => {
  it('parses supported shareable list state', () => {
    expect(parseListQuery({search: 'food', page: '2', pageSize: '50'})).toEqual({
      search: 'food',
      page: 2,
      pageSize: 50,
    });
  });

  it('rejects invalid pagination values', () => {
    expect(parseListQuery({page: '-2', pageSize: '999'})).toEqual({search: '', page: 1, pageSize: 25});
  });
});
