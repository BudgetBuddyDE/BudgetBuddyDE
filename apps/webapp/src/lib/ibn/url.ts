import {IBN_TARGETS} from './targets';
import {IBN_ACTIONS, IBN_ENTITIES, IBN_QUERY_KEYS, type Intent, type IntentAction, type IntentEntity} from './types';

export type ParsedIntent = {intent: Intent} | {error: string} | null;

const isIntentEntity = (value: string | null): value is IntentEntity =>
  value !== null && (IBN_ENTITIES as readonly string[]).includes(value);

const isIntentAction = (value: string | null): value is IntentAction =>
  value !== null && (IBN_ACTIONS as readonly string[]).includes(value);

const canTargetHandleAction = (entity: IntentEntity, action: IntentAction) =>
  (IBN_TARGETS[entity].actions as readonly IntentAction[]).includes(action);

export function parseIntentFromSearchParams(params: URLSearchParams): ParsedIntent {
  const entityValue = params.get(IBN_QUERY_KEYS.entity);
  const actionValue = params.get(IBN_QUERY_KEYS.action);

  if (!entityValue && !actionValue) return null;
  if (!isIntentEntity(entityValue)) return {error: `Invalid intent entity: ${entityValue ?? 'missing'}`};
  if (!isIntentAction(actionValue)) return {error: `Invalid intent action: ${actionValue ?? 'missing'}`};
  if (!canTargetHandleAction(entityValue, actionValue)) {
    return {error: `${IBN_TARGETS[entityValue].label} does not support ${actionValue}`};
  }

  const id = params.get(IBN_QUERY_KEYS.id);
  const parentEntity = params.get(IBN_QUERY_KEYS.parentEntity);
  const parentId = params.get(IBN_QUERY_KEYS.parentId);

  if (actionValue === 'create') {
    if (entityValue === 'attachment') {
      if (parentEntity !== 'transaction') return {error: 'Attachment creation requires transaction parent'};
      if (!parentId) return {error: 'Attachment creation requires parent ID'};
      return {intent: {entity: 'attachment', action: 'create', parentEntity, parentId}};
    }

    switch (entityValue) {
      case 'transaction':
      case 'recurringPayment':
      case 'paymentMethod':
      case 'category':
      case 'budget':
      case 'apiKey':
        return {intent: {entity: entityValue, action: 'create'} as Intent};
      default:
        return {error: `${entityValue} does not support create`};
    }
  }

  if (!id) return {error: `${actionValue} intent requires ID`};

  switch (entityValue) {
    case 'transaction':
    case 'recurringPayment':
    case 'paymentMethod':
    case 'category':
    case 'budget':
      return {intent: {entity: entityValue, action: actionValue, id} as Intent};
    case 'attachment':
      if (actionValue !== 'delete') return {error: 'Attachment only supports create and delete'};
      return {intent: {entity: 'attachment', action: 'delete', id}};
    case 'apiKey':
      if (actionValue !== 'delete') return {error: 'API Key only supports create and delete'};
      return {intent: {entity: 'apiKey', action: 'delete', id}};
  }
}

export function serializeIntentToSearchParams(intent: Intent): URLSearchParams {
  const params = new URLSearchParams();
  params.set(IBN_QUERY_KEYS.entity, intent.entity);
  params.set(IBN_QUERY_KEYS.action, intent.action);

  if ('id' in intent) params.set(IBN_QUERY_KEYS.id, intent.id);
  if ('parentEntity' in intent) params.set(IBN_QUERY_KEYS.parentEntity, intent.parentEntity);
  if ('parentId' in intent) params.set(IBN_QUERY_KEYS.parentId, intent.parentId);

  return params;
}

export function stripIntentSearchParams(params: URLSearchParams): URLSearchParams {
  const stripped = new URLSearchParams(params.toString());
  Object.values(IBN_QUERY_KEYS).forEach(key => stripped.delete(key));
  return stripped;
}

export function buildIntentHref(intent: Intent): string {
  const route =
    intent.entity === 'attachment' && intent.action === 'create'
      ? IBN_TARGETS.attachment.createRoute
      : IBN_TARGETS[intent.entity].route;
  const params = serializeIntentToSearchParams(intent);
  return `${route}?${params.toString()}`;
}
