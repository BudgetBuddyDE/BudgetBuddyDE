import {describe, expect, it} from 'vitest';
import {
  parseKeywordFilterFromParams,
  parseRecurringPaymentFiltersFromParams,
  parseTransactionFiltersFromParams,
  serializeKeywordFilter,
  serializeRecurringPaymentFilters,
  serializeTransactionFilters,
} from './URLUtil';

suite('Filter - URL utils', () => {
  describe('parseTransactionFiltersFromParams', () => {
    it('returns empty object for empty params', () => {
      expect(parseTransactionFiltersFromParams({})).toEqual({});
    });

    it('parses keyword from "q" param', () => {
      expect(parseTransactionFiltersFromParams({q: 'groceries'})).toEqual({keyword: 'groceries'});
    });

    it('ignores empty string keyword', () => {
      expect(parseTransactionFiltersFromParams({q: ''})).toEqual({});
    });

    it('ignores array values for keyword', () => {
      expect(parseTransactionFiltersFromParams({q: ['a', 'b']})).toEqual({});
    });

    it('parses valid dateFrom ISO string', () => {
      const result = parseTransactionFiltersFromParams({dateFrom: '2024-01-15T00:00:00.000Z'});
      expect(result.dateFrom).toBeInstanceOf(Date);
      expect(result.dateFrom?.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });

    it('parses valid dateTo ISO string', () => {
      const result = parseTransactionFiltersFromParams({dateTo: '2024-12-31T00:00:00.000Z'});
      expect(result.dateTo).toBeInstanceOf(Date);
      expect(result.dateTo?.toISOString()).toBe('2024-12-31T00:00:00.000Z');
    });

    it('ignores invalid dateFrom', () => {
      expect(parseTransactionFiltersFromParams({dateFrom: 'not-a-date'})).toEqual({});
    });

    it('ignores invalid dateTo', () => {
      expect(parseTransactionFiltersFromParams({dateTo: 'not-a-date'})).toEqual({});
    });

    it('parses comma-separated categories', () => {
      expect(parseTransactionFiltersFromParams({cat: 'cat1,cat2,cat3'})).toEqual({
        categories: ['cat1', 'cat2', 'cat3'],
      });
    });

    it('parses comma-separated excl_categories', () => {
      expect(parseTransactionFiltersFromParams({excl_cat: 'catA,catB'})).toEqual({
        excl_categories: ['catA', 'catB'],
      });
    });

    it('parses comma-separated paymentMethods', () => {
      expect(parseTransactionFiltersFromParams({pm: 'pm1,pm2'})).toEqual({
        paymentMethods: ['pm1', 'pm2'],
      });
    });

    it('parses comma-separated excl_paymentMethods', () => {
      expect(parseTransactionFiltersFromParams({excl_pm: 'pmX'})).toEqual({
        excl_paymentMethods: ['pmX'],
      });
    });

    it('parses array values for categories by joining them', () => {
      expect(parseTransactionFiltersFromParams({cat: ['cat1', 'cat2']})).toEqual({
        categories: ['cat1', 'cat2'],
      });
    });

    it('ignores empty categories param', () => {
      expect(parseTransactionFiltersFromParams({cat: ''})).toEqual({});
    });

    it('parses all fields together', () => {
      const result = parseTransactionFiltersFromParams({
        q: 'food',
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-06-30T00:00:00.000Z',
        cat: 'c1,c2',
        excl_cat: 'c3',
        pm: 'p1',
        excl_pm: 'p2',
      });
      expect(result.keyword).toBe('food');
      expect(result.dateFrom).toBeInstanceOf(Date);
      expect(result.dateTo).toBeInstanceOf(Date);
      expect(result.categories).toEqual(['c1', 'c2']);
      expect(result.excl_categories).toEqual(['c3']);
      expect(result.paymentMethods).toEqual(['p1']);
      expect(result.excl_paymentMethods).toEqual(['p2']);
    });

    it('does not include executeFrom or executeTo fields', () => {
      const result = parseTransactionFiltersFromParams({execFrom: '5', execTo: '20'});
      expect(result).not.toHaveProperty('executeFrom');
      expect(result).not.toHaveProperty('executeTo');
    });
  });

  describe('parseRecurringPaymentFiltersFromParams', () => {
    it('returns empty object for empty params', () => {
      expect(parseRecurringPaymentFiltersFromParams({})).toEqual({});
    });

    it('parses keyword', () => {
      expect(parseRecurringPaymentFiltersFromParams({q: 'netflix'})).toEqual({keyword: 'netflix'});
    });

    it('parses executeFrom as integer', () => {
      expect(parseRecurringPaymentFiltersFromParams({execFrom: '5'})).toEqual({executeFrom: 5});
    });

    it('parses executeTo as integer', () => {
      expect(parseRecurringPaymentFiltersFromParams({execTo: '28'})).toEqual({executeTo: 28});
    });

    it('ignores non-numeric executeFrom', () => {
      expect(parseRecurringPaymentFiltersFromParams({execFrom: 'abc'})).toEqual({});
    });

    it('ignores non-numeric executeTo', () => {
      expect(parseRecurringPaymentFiltersFromParams({execTo: 'xyz'})).toEqual({});
    });

    it('parses categories and payment methods', () => {
      const result = parseRecurringPaymentFiltersFromParams({
        cat: 'c1',
        excl_cat: 'c2',
        pm: 'p1',
        excl_pm: 'p2',
      });
      expect(result.categories).toEqual(['c1']);
      expect(result.excl_categories).toEqual(['c2']);
      expect(result.paymentMethods).toEqual(['p1']);
      expect(result.excl_paymentMethods).toEqual(['p2']);
    });

    it('does not include dateFrom or dateTo fields', () => {
      const result = parseRecurringPaymentFiltersFromParams({
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-12-31T00:00:00.000Z',
      });
      expect(result).not.toHaveProperty('dateFrom');
      expect(result).not.toHaveProperty('dateTo');
    });
  });

  describe('parseKeywordFilterFromParams', () => {
    it('returns empty object for empty params', () => {
      expect(parseKeywordFilterFromParams({})).toEqual({});
    });

    it('parses keyword', () => {
      expect(parseKeywordFilterFromParams({q: 'visa'})).toEqual({keyword: 'visa'});
    });

    it('ignores empty string keyword', () => {
      expect(parseKeywordFilterFromParams({q: ''})).toEqual({});
    });

    it('ignores array keyword', () => {
      expect(parseKeywordFilterFromParams({q: ['a', 'b']})).toEqual({});
    });

    it('ignores all other params', () => {
      expect(parseKeywordFilterFromParams({cat: 'c1', pm: 'p1', dateFrom: '2024-01-01'})).toEqual({});
    });
  });

  describe('serializeTransactionFilters', () => {
    const emptyFilters = {} as Parameters<typeof serializeTransactionFilters>[0];

    it('returns empty URLSearchParams for empty filters', () => {
      const p = serializeTransactionFilters(emptyFilters);
      expect(p.toString()).toBe('');
    });

    it('serializes keyword as "q"', () => {
      const p = serializeTransactionFilters({...emptyFilters, keyword: 'test'});
      expect(p.get('q')).toBe('test');
    });

    it('serializes dateFrom as ISO string', () => {
      const date = new Date('2024-03-01T00:00:00.000Z');
      const p = serializeTransactionFilters({...emptyFilters, dateFrom: date});
      expect(p.get('dateFrom')).toBe(date.toISOString());
    });

    it('serializes dateTo as ISO string', () => {
      const date = new Date('2024-03-31T23:59:59.999Z');
      const p = serializeTransactionFilters({...emptyFilters, dateTo: date});
      expect(p.get('dateTo')).toBe(date.toISOString());
    });

    it('serializes categories as comma-separated string', () => {
      const p = serializeTransactionFilters({...emptyFilters, categories: ['c1', 'c2']});
      expect(p.get('cat')).toBe('c1,c2');
    });

    it('serializes excl_categories as comma-separated string', () => {
      const p = serializeTransactionFilters({...emptyFilters, excl_categories: ['c3']});
      expect(p.get('excl_cat')).toBe('c3');
    });

    it('serializes paymentMethods as comma-separated string', () => {
      const p = serializeTransactionFilters({...emptyFilters, paymentMethods: ['p1', 'p2']});
      expect(p.get('pm')).toBe('p1,p2');
    });

    it('serializes excl_paymentMethods as comma-separated string', () => {
      const p = serializeTransactionFilters({...emptyFilters, excl_paymentMethods: ['p3']});
      expect(p.get('excl_pm')).toBe('p3');
    });

    it('omits empty arrays', () => {
      const p = serializeTransactionFilters({...emptyFilters, categories: [], paymentMethods: []});
      expect(p.has('cat')).toBe(false);
      expect(p.has('pm')).toBe(false);
    });

    it('does not serialize executeFrom or executeTo', () => {
      const p = serializeTransactionFilters({...emptyFilters, executeFrom: 5, executeTo: 20});
      expect(p.has('execFrom')).toBe(false);
      expect(p.has('execTo')).toBe(false);
    });
  });

  describe('serializeRecurringPaymentFilters', () => {
    const emptyFilters = {} as Parameters<typeof serializeRecurringPaymentFilters>[0];

    it('returns empty URLSearchParams for empty filters', () => {
      expect(serializeRecurringPaymentFilters(emptyFilters).toString()).toBe('');
    });

    it('serializes keyword', () => {
      const p = serializeRecurringPaymentFilters({...emptyFilters, keyword: 'spotify'});
      expect(p.get('q')).toBe('spotify');
    });

    it('serializes executeFrom as string number', () => {
      const p = serializeRecurringPaymentFilters({...emptyFilters, executeFrom: 1});
      expect(p.get('execFrom')).toBe('1');
    });

    it('serializes executeTo as string number', () => {
      const p = serializeRecurringPaymentFilters({...emptyFilters, executeTo: 31});
      expect(p.get('execTo')).toBe('31');
    });

    it('serializes executeFrom=0 (falsy but valid)', () => {
      const p = serializeRecurringPaymentFilters({...emptyFilters, executeFrom: 0});
      expect(p.get('execFrom')).toBe('0');
    });

    it('serializes categories, paymentMethods', () => {
      const p = serializeRecurringPaymentFilters({
        ...emptyFilters,
        categories: ['c1'],
        paymentMethods: ['p1', 'p2'],
      });
      expect(p.get('cat')).toBe('c1');
      expect(p.get('pm')).toBe('p1,p2');
    });

    it('does not serialize dateFrom or dateTo', () => {
      const date = new Date();
      const p = serializeRecurringPaymentFilters({...emptyFilters, dateFrom: date, dateTo: date});
      expect(p.has('dateFrom')).toBe(false);
      expect(p.has('dateTo')).toBe(false);
    });
  });

  describe('serializeKeywordFilter', () => {
    const emptyFilters = {} as Parameters<typeof serializeKeywordFilter>[0];

    it('returns empty URLSearchParams when no keyword', () => {
      expect(serializeKeywordFilter(emptyFilters).toString()).toBe('');
    });

    it('serializes keyword as "q"', () => {
      const p = serializeKeywordFilter({...emptyFilters, keyword: 'hello'});
      expect(p.get('q')).toBe('hello');
    });

    it('does not include any other filter params', () => {
      const date = new Date();
      const p = serializeKeywordFilter({
        ...emptyFilters,
        keyword: 'test',
        dateFrom: date,
        categories: ['c1'],
      });
      expect(Array.from(p.keys())).toEqual(['q']);
    });
  });

  describe('round-trip: transaction filters', () => {
    it('serialized params can be parsed back to the same filters', () => {
      const date = new Date('2024-06-15T00:00:00.000Z');
      const original = {
        keyword: 'coffee',
        dateFrom: date,
        dateTo: date,
        categories: ['cat-1', 'cat-2'],
        excl_categories: ['cat-3'],
        paymentMethods: ['pm-1'],
        excl_paymentMethods: ['pm-2'],
      };

      const params = serializeTransactionFilters(original);
      const paramsObj = Object.fromEntries(params.entries());
      const parsed = parseTransactionFiltersFromParams(paramsObj);

      expect(parsed.keyword).toBe(original.keyword);
      expect(parsed.dateFrom?.toISOString()).toBe(original.dateFrom.toISOString());
      expect(parsed.dateTo?.toISOString()).toBe(original.dateTo.toISOString());
      expect(parsed.categories).toEqual(original.categories);
      expect(parsed.excl_categories).toEqual(original.excl_categories);
      expect(parsed.paymentMethods).toEqual(original.paymentMethods);
      expect(parsed.excl_paymentMethods).toEqual(original.excl_paymentMethods);
    });
  });

  describe('round-trip: recurring payment filters', () => {
    it('serialized params can be parsed back to the same filters', () => {
      const original = {
        keyword: 'netflix',
        executeFrom: 1,
        executeTo: 15,
        categories: ['c1'],
        excl_categories: ['c2'],
        paymentMethods: ['p1'],
        excl_paymentMethods: ['p2'],
      };

      const params = serializeRecurringPaymentFilters(original);
      const paramsObj = Object.fromEntries(params.entries());
      const parsed = parseRecurringPaymentFiltersFromParams(paramsObj);

      expect(parsed.keyword).toBe(original.keyword);
      expect(parsed.executeFrom).toBe(original.executeFrom);
      expect(parsed.executeTo).toBe(original.executeTo);
      expect(parsed.categories).toEqual(original.categories);
      expect(parsed.excl_categories).toEqual(original.excl_categories);
      expect(parsed.paymentMethods).toEqual(original.paymentMethods);
      expect(parsed.excl_paymentMethods).toEqual(original.excl_paymentMethods);
    });
  });
});
