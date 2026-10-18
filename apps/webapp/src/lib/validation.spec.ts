import {createTranslator} from 'next-intl';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {
  createEmptyRow as categoryRow,
  createMapRowsToPayload as categoryMapper,
} from '@/components/Category/CategoryTable/categoryBatchAdapter';
import {
  createEmptyRow as paymentMethodRow,
  createMapRowsToPayload as paymentMethodMapper,
} from '@/components/PaymentMethod/PaymentMethodTable/paymentMethodBatchAdapter';
import {
  createEmptyRow as recurringRow,
  createMapRowsToPayload as recurringMapper,
} from '@/components/RecurringPayment/RecurringPaymentTable/recurringPaymentBatchAdapter';
import {mapDraftRowsToPayload} from '@/components/Table/BatchEntityDialog/mapRowsToPayload';
import {
  createEmptyRow as transactionRow,
  createMapRowsToPayload as transactionMapper,
} from '@/components/Transaction/TransactionTable/transactionBatchAdapter';
import {getMessageKey} from './i18n/config';
import {createAppTranslator} from './i18n/translate';
import {translateValidationIssue, type ValidationIssue} from './validation/translateValidationIssue';

const english = createAppTranslator(createTranslator({locale: 'en-US', messages: {} as Record<string, string>}));

describe('validation translations', () => {
  it('routes schema issues from all four batch adapters through the supplied translator', () => {
    const t = () => 'Localized validation issue';
    const results = [
      categoryMapper(t)([categoryRow()]),
      paymentMethodMapper(t)([paymentMethodRow()]),
      transactionMapper(t)([transactionRow()]),
      recurringMapper(t)([recurringRow()]),
    ];
    for (const result of results) {
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues.length).toBeGreaterThan(0);
        expect(
          result.issues.every(issue =>
            /^(Localized validation issue)(, Localized validation issue)*$/.test(issue.message),
          ),
        ).toBe(true);
      }
    }
  });
  it.each<[ValidationIssue, string]>([
    [{code: 'invalid_type', expected: 'string', message: 'raw'}, 'Enter a valid text value.'],
    [{code: 'invalid_type', expected: 'number', message: 'raw'}, 'Enter a valid number.'],
    [{code: 'invalid_type', expected: 'date', message: 'raw'}, 'Enter a valid date.'],
    [{code: 'invalid_type', expected: 'boolean', message: 'raw'}, 'Select a valid boolean value.'],
    [{code: 'invalid_type', expected: 'array', message: 'raw'}, 'Select valid items.'],
    [{code: 'too_small', origin: 'string', minimum: 2, message: 'raw'}, 'Enter at least 2 characters.'],
    [{code: 'too_small', origin: 'array', minimum: 1, message: 'raw'}, 'Select at least 1 items.'],
    [{code: 'too_small', minimum: 0, inclusive: false, message: 'raw'}, 'Enter a value greater than 0.'],
    [{code: 'too_small', minimum: 1, inclusive: true, message: 'raw'}, 'Enter a value of at least 1.'],
    [{code: 'too_big', origin: 'string', maximum: 40, message: 'raw'}, 'Enter no more than 40 characters.'],
    [{code: 'too_big', origin: 'array', maximum: 2, message: 'raw'}, 'Select no more than 2 items.'],
    [{code: 'too_big', maximum: 10, inclusive: false, message: 'raw'}, 'Enter a value less than 10.'],
    [{code: 'too_big', maximum: 10, inclusive: true, message: 'raw'}, 'Enter a value of at most 10.'],
    [{code: 'invalid_format', format: 'uuid', message: 'raw'}, 'Select a valid item.'],
    [{code: 'invalid_format', format: 'email', message: 'raw'}, 'Enter a valid email address.'],
    [{code: 'invalid_format', format: 'url', message: 'raw'}, 'Enter a valid URL.'],
    [{code: 'invalid_value', message: 'raw'}, 'Select a valid option.'],
    [{code: 'custom', message: 'raw'}, 'Enter a valid value.'],
  ])('maps issue metadata to localized text: %j', (issue, expected) => {
    expect(translateValidationIssue(issue, english)).toBe(expected);
  });

  it('uses the supplied catalog without affecting another translator or global Zod errors', () => {
    const source = 'Enter at least {minimum} characters.';
    const localized = createAppTranslator(
      createTranslator({
        locale: 'en-US',
        messages: {[getMessageKey(source)]: 'Minimum length: {minimum}'} as Record<string, string>,
      }),
    );
    const schema = z.object({name: z.string().min(2)});
    const rows = [{id: 'row-1', name: ''}];
    const before = schema.safeParse(rows[0]);
    expect(mapDraftRowsToPayload(rows, schema, row => row, undefined, localized)).toEqual({
      success: false,
      issues: [{rowId: 'row-1', message: 'Minimum length: 2'}],
    });
    expect(mapDraftRowsToPayload(rows, schema, row => row, undefined, english)).toEqual({
      success: false,
      issues: [{rowId: 'row-1', message: 'Enter at least 2 characters.'}],
    });
    expect(schema.safeParse(rows[0])).toEqual(before);
    expect(mapDraftRowsToPayload([{id: 'row-2', name: 'Valid'}], schema, row => row, undefined, english)).toEqual({
      success: true,
      payload: [{name: 'Valid'}],
    });
  });
});
