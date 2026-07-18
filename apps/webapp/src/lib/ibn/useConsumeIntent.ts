'use client';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import type {Intent, IntentEntity} from './types';
import {parseIntentFromSearchParams, stripIntentSearchParams} from './url';

export type IntentHandlers = {
  onCreate?: () => void | Promise<void>;
  onEdit?: (id: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onAttachmentCreate?: (parent: {entity: 'transaction'; id: string}) => void | Promise<void>;
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

export function useConsumeIntent(entity: IntentEntity, handlers: IntentHandlers): void {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const consumedIntentKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
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
      handlers.onInvalid?.(parsed.error);
      const stripped = stripIntentSearchParams(params);
      const strippedQuery = stripped.toString();
      router.replace(strippedQuery ? `${pathname}?${strippedQuery}` : pathname);
      return;
    }

    const {intent} = parsed;
    if (!shouldConsumeIntent(entity, intent)) return;

    consumedIntentKeyRef.current = intentKey;

    const consume = async () => {
      if (intent.action === 'create') {
        if (intent.entity === 'attachment') {
          await handlers.onAttachmentCreate?.({entity: intent.parentEntity, id: intent.parentId});
        } else {
          await handlers.onCreate?.();
        }
      } else if (intent.action === 'edit') {
        await handlers.onEdit?.(intent.id);
      } else {
        await handlers.onDelete?.(intent.id);
      }

      const stripped = stripIntentSearchParams(params);
      const strippedQuery = stripped.toString();
      router.replace(strippedQuery ? `${pathname}?${strippedQuery}` : pathname);
    };

    consume().catch(error => {
      const message = error instanceof Error ? error.message : 'Failed to consume intent';
      handlers.onInvalid?.(message);
      const stripped = stripIntentSearchParams(params);
      const strippedQuery = stripped.toString();
      router.replace(strippedQuery ? `${pathname}?${strippedQuery}` : pathname);
    });
  }, [entity, handlers, pathname, router, searchParams]);
}
