/** Query-string keys used to transport an intent between pages. */
export const IBN_QUERY_KEYS = {
  entity: 'ibnEntity',
  action: 'ibnAction',
  id: 'ibnId',
  parentEntity: 'ibnParentEntity',
  parentId: 'ibnParentId',
} as const;

/** Entities that can be addressed through Intent-Based Navigation. */
export const IBN_ENTITIES = [
  'transaction',
  'recurringPayment',
  'paymentMethod',
  'category',
  'budget',
  'attachment',
  'apiKey',
] as const;

/** Actions that can be requested through an intent. */
export const IBN_ACTIONS = ['create', 'edit', 'delete'] as const;

/** Union of supported intent entity names. */
export type IntentEntity = (typeof IBN_ENTITIES)[number];

/** Union of supported intent actions. */
export type IntentAction = (typeof IBN_ACTIONS)[number];

/** Type-safe request to create, edit, or delete a supported entity. */
export type Intent =
  | {entity: 'transaction'; action: 'create'}
  | {entity: 'transaction'; action: 'edit' | 'delete'; id: string}
  | {entity: 'recurringPayment'; action: 'create'}
  | {entity: 'recurringPayment'; action: 'edit' | 'delete'; id: string}
  | {entity: 'paymentMethod'; action: 'create'}
  | {entity: 'paymentMethod'; action: 'edit' | 'delete'; id: string}
  | {entity: 'category'; action: 'create'}
  | {entity: 'category'; action: 'edit' | 'delete'; id: string}
  | {entity: 'budget'; action: 'create'}
  | {entity: 'budget'; action: 'edit' | 'delete'; id: string}
  | {entity: 'attachment'; action: 'create'; parentEntity: 'transaction'; parentId: string}
  | {entity: 'attachment'; action: 'delete'; id: string}
  | {entity: 'apiKey'; action: 'create'}
  | {entity: 'apiKey'; action: 'delete'; id: string};
