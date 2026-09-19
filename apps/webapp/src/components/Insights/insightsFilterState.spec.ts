import {describe, expect, it} from 'vitest';
import {
  haveSameInsightsFilterIds,
  parseInsightsFilterIds,
  selectInsightsFilterOptions,
  serializeInsightsSearchParams,
} from './insightsFilterState';

const options = [{id: 'first'}, {id: 'second'}, {id: 'third'}];

describe('insightsFilterState', () => {
  it('preserves URL filter order while resolving available options', () => {
    expect(selectInsightsFilterOptions(options, ['third', 'first', 'missing'])).toEqual([{id: 'third'}, {id: 'first'}]);
  });

  it('compares filter selections by ordered ids', () => {
    expect(haveSameInsightsFilterIds(options.slice(0, 2), [{id: 'first'}, {id: 'second'}])).toBe(true);
    expect(haveSameInsightsFilterIds(options.slice(0, 2), [{id: 'second'}, {id: 'first'}])).toBe(false);
  });

  it('parses and serializes filters deterministically', () => {
    expect(parseInsightsFilterIds(' second, first, ')).toEqual(['second', 'first']);
    expect(
      serializeInsightsSearchParams({
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: new Date('2026-01-31T00:00:00.000Z'),
        granularity: 'month',
        comparison: 'previous',
        categories: [{id: 'second'}, {id: 'first'}],
        paymentMethods: [{id: 'pm-1'}],
      }),
    ).toBe('from=2026-01-01&to=2026-01-31&granularity=month&comparison=previous&cat=second%2Cfirst&pm=pm-1');
  });
});
