'use client';

import {usePathname, useSearchParams} from 'next/navigation';
import React from 'react';
import {waitForPageTransitions} from '@/lib/viewTransitions';
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
  const query = searchParams.toString();
  const consumedIntentKeyRef = React.useRef<string | null>(null);
  const handlersRef = React.useRef(handlers);
  const currentRouteRef = React.useRef('');
  handlersRef.current = handlers;
  currentRouteRef.current = `${pathname}?${query}`;

  React.useEffect(() => {
    const params = new URLSearchParams(query);
    const parsed = parseIntentFromSearchParams(params);

    if (!parsed) {
      consumedIntentKeyRef.current = null;
      return;
    }

    const intentKey = intentKeyFromParams(params);
    if (consumedIntentKeyRef.current === intentKey) return;
    if ('intent' in parsed && !shouldConsumeIntent(entity, parsed.intent)) return;

    const controller = new AbortController();
    const currentRoute = `${pathname}?${query}`;
    const isCurrent = () => !controller.signal.aborted && currentRouteRef.current === currentRoute;
    const stripIntent = () => {
      if (!isCurrent()) return;
      const strippedQuery = stripIntentSearchParams(params).toString();
      const href = strippedQuery ? `${pathname}?${strippedQuery}` : pathname;
      // This only changes URL bookkeeping, without navigating/refetching the page.
      const state = {...window.history.state};
      // Next copies its markers back in. Passing them here bypasses its URL sync.
      delete state.__NA;
      delete state._N;
      window.history.replaceState(state, '', `${href}${window.location.hash}`);
    };

    const consume = async () => {
      await waitForPageTransitions(controller.signal);
      if (!isCurrent() || consumedIntentKeyRef.current === intentKey) return;

      // Claim only after waiting: Strict Mode may cancel and replay the effect.
      consumedIntentKeyRef.current = intentKey;
      try {
        if ('error' in parsed) {
          handlersRef.current.onInvalid?.(parsed.error);
          return;
        }

        const {intent} = parsed;
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
      } catch (error) {
        if (!isCurrent()) return;
        const message = error instanceof Error ? error.message : 'Failed to consume intent';
        handlersRef.current.onInvalid?.(message);
      } finally {
        stripIntent();
      }
    };

    void consume();
    return () => controller.abort();
  }, [entity, pathname, query]);
}
