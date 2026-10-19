'use client';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import type {Intent, IntentEntity} from './types';
import {parseIntentFromSearchParams, stripIntentSearchParams} from './url';

/** Callbacks invoked when a destination consumes an intent. */
export type IntentHandlers = {
  /** Opens the create UI for the addressed entity. */
  onCreate?: () => void | Promise<void>;
  /** Opens the edit UI for the entity with the given ID. */
  onEdit?: (id: string) => void | Promise<void>;
  /** Opens the delete flow for the entity with the given ID. */
  onDelete?: (id: string) => void | Promise<void>;
  /** Opens attachment creation for the referenced transaction. */
  onAttachmentCreate?: (parent: {entity: 'transaction'; id: string}) => void | Promise<void>;
  /** Reports malformed intents or handler failures. */
  onInvalid?: (message: string) => void;
};

const shouldConsumeIntent = (entity: IntentEntity, intent: Intent) => {
  if (intent.entity === entity) return true;
  return entity === 'transaction' && intent.entity === 'attachment' && intent.action === 'create';
};

const intentKeyFromParams = (params: URLSearchParams) => {
  const keys = ['ibnEntity', 'ibnAction', 'ibnId', 'ibnParentEntity', 'ibnParentId'];
  const intentParams = new URLSearchParams();
  keys.forEach(key => {
    const value = params.get(key);
    if (value !== null) intentParams.set(key, value);
  });
  return intentParams.toString();
};

/**
 * Consumes the intent addressed to a feature and removes it from the URL.
 *
 * Invalid intents and handler failures are reported through `onInvalid` and are
 * removed as well, preventing repeated execution on subsequent renders.
 */
export function useConsumeIntent(entity: IntentEntity, handlers: IntentHandlers): void {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const consumedIntentKeyRef = React.useRef<string | null>(null);
  const handlersRef = React.useRef(handlers);
  const currentRouteRef = React.useRef('');
  const mountedRef = React.useRef(false);
  handlersRef.current = handlers;
  currentRouteRef.current = `${pathname}?${searchParams.toString()}`;

  React.useLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useLayoutEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const parsed = parseIntentFromSearchParams(params);

    if (!parsed) {
      consumedIntentKeyRef.current = null;
      return;
    }

    const intentKey = intentKeyFromParams(params);
    if (consumedIntentKeyRef.current === intentKey) return;

    if ('error' in parsed) {
      consumedIntentKeyRef.current = intentKey;
      handlersRef.current.onInvalid?.(parsed.error);
      const stripped = stripIntentSearchParams(params);
      const strippedQuery = stripped.toString();
      router.replace(strippedQuery ? `${pathname}?${strippedQuery}` : pathname);
      return;
    }

    const {intent} = parsed;
    if (!shouldConsumeIntent(entity, intent)) return;

    consumedIntentKeyRef.current = intentKey;
    const currentRoute = currentRouteRef.current;
    const consume = async () => {
      if (intent.action === 'create') {
        if (intent.entity === 'attachment') {
          await handlersRef.current.onAttachmentCreate?.({entity: intent.parentEntity, id: intent.parentId});
        } else {
          await handlersRef.current.onCreate?.();
        }
      } else if (intent.action === 'edit') {
        await handlersRef.current.onEdit?.(intent.id);
      } else {
        await handlersRef.current.onDelete?.(intent.id);
      }

      if (!mountedRef.current || currentRouteRef.current !== currentRoute) return;
      const stripped = stripIntentSearchParams(params);
      const strippedQuery = stripped.toString();
      router.replace(strippedQuery ? `${pathname}?${strippedQuery}` : pathname);
    };

    consume().catch(error => {
      if (!mountedRef.current || currentRouteRef.current !== currentRoute) return;
      const message = error instanceof Error ? error.message : 'Failed to consume intent';
      handlersRef.current.onInvalid?.(message);
      const stripped = stripIntentSearchParams(params);
      const strippedQuery = stripped.toString();
      router.replace(strippedQuery ? `${pathname}?${strippedQuery}` : pathname);
    });
  }, [entity, pathname, router, searchParams]);
}
