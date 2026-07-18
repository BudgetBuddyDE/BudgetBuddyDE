export const IBN_QUERY_KEYS = {
  entity: 'ibnEntity',
  action: 'ibnAction',
  id: 'ibnId',
  parentEntity: 'ibnParentEntity',
  parentId: 'ibnParentId',
} as const;

export const IBN_ENTITIES = [
  'transaction',
  'recurringPayment',
  'paymentMethod',
  'category',
  'budget',
  'attachment',
  'apiKey',
] as const;

export const IBN_ACTIONS = ['create', 'edit', 'delete'] as const;

export type IntentEntity = (typeof IBN_ENTITIES)[number];
export type IntentAction = (typeof IBN_ACTIONS)[number];

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
