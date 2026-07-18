import {describe, expect, it} from 'vitest';
import {
  buildIntentHref,
  parseIntentFromSearchParams,
  serializeIntentToSearchParams,
  stripIntentSearchParams,
} from './url';

const expectSerializedIntent = (href: string, expectedPath: string, expectedQuery: string) => {
  const [path, query] = href.split('?');
  expect(path).toBe(expectedPath);
  expect(query).toBe(expectedQuery);
};

describe('IBN URL contract', () => {
  it('serializes all create routes exactly', () => {
    expectSerializedIntent(
      buildIntentHref({entity: 'transaction', action: 'create'}),
      '/transactions',
      'ibnEntity=transaction&ibnAction=create',
    );
    expectSerializedIntent(
      buildIntentHref({entity: 'recurringPayment', action: 'create'}),
      '/recurringPayments',
      'ibnEntity=recurringPayment&ibnAction=create',
    );
    expectSerializedIntent(
      buildIntentHref({entity: 'paymentMethod', action: 'create'}),
      '/paymentMethods',
      'ibnEntity=paymentMethod&ibnAction=create',
    );
    expectSerializedIntent(
      buildIntentHref({entity: 'category', action: 'create'}),
      '/categories',
      'ibnEntity=category&ibnAction=create',
    );
    expectSerializedIntent(
      buildIntentHref({entity: 'budget', action: 'create'}),
      '/dashboard/budget',
      'ibnEntity=budget&ibnAction=create',
    );
    expectSerializedIntent(
      buildIntentHref({entity: 'apiKey', action: 'create'}),
      '/settings/api-keys',
      'ibnEntity=apiKey&ibnAction=create',
    );
    expectSerializedIntent(
      buildIntentHref({entity: 'attachment', action: 'create', parentEntity: 'transaction', parentId: 'tx-1'}),
      '/transactions',
      'ibnEntity=attachment&ibnAction=create&ibnParentEntity=transaction&ibnParentId=tx-1',
    );
  });

  it('builds the transaction create href exactly', () => {
    expect(buildIntentHref({entity: 'transaction', action: 'create'})).toBe(
      '/transactions?ibnEntity=transaction&ibnAction=create',
    );
  });

  it('builds the attachment create href exactly', () => {
    expect(
      buildIntentHref({entity: 'attachment', action: 'create', parentEntity: 'transaction', parentId: 'tx-1'}),
    ).toBe('/transactions?ibnEntity=attachment&ibnAction=create&ibnParentEntity=transaction&ibnParentId=tx-1');
  });

  it('serializes edit and delete IDs', () => {
    expect(serializeIntentToSearchParams({entity: 'category', action: 'edit', id: 'cat-1'}).toString()).toBe(
      'ibnEntity=category&ibnAction=edit&ibnId=cat-1',
    );
    expect(serializeIntentToSearchParams({entity: 'apiKey', action: 'delete', id: 'key-1'}).toString()).toBe(
      'ibnEntity=apiKey&ibnAction=delete&ibnId=key-1',
    );
  });

  it('returns errors for edit and delete without ID', () => {
    expect(parseIntentFromSearchParams(new URLSearchParams('ibnEntity=transaction&ibnAction=edit'))).toEqual({
      error: 'edit intent requires ID',
    });
    expect(parseIntentFromSearchParams(new URLSearchParams('ibnEntity=transaction&ibnAction=delete'))).toEqual({
      error: 'delete intent requires ID',
    });
  });

  it('returns an error for attachment create without parent ID', () => {
    expect(
      parseIntentFromSearchParams(
        new URLSearchParams('ibnEntity=attachment&ibnAction=create&ibnParentEntity=transaction'),
      ),
    ).toEqual({error: 'Attachment creation requires parent ID'});
  });

  it('returns errors for unknown entity and action', () => {
    expect(parseIntentFromSearchParams(new URLSearchParams('ibnEntity=nope&ibnAction=create'))).toEqual({
      error: 'Invalid intent entity: nope',
    });
    expect(parseIntentFromSearchParams(new URLSearchParams('ibnEntity=transaction&ibnAction=nope'))).toEqual({
      error: 'Invalid intent action: nope',
    });
  });

  it('strips only IBN keys and preserves filters', () => {
    expect(
      stripIntentSearchParams(new URLSearchParams('q=food&ibnEntity=transaction&ibnAction=create')).toString(),
    ).toBe('q=food');
  });
});
