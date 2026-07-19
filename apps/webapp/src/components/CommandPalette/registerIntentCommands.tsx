'use client';

import DeleteRounded from '@mui/icons-material/DeleteRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import React from 'react';
import {useSnackbarContext} from '@/components/Snackbar';
import {
  EntityIcon,
  IBN_ENTITIES,
  IBN_TARGETS,
  searchIntentTargets,
  type Intent,
  type IntentAction,
  type IntentEntity,
  type IntentTargetOption,
  useIntentNavigation,
} from '@/lib/ibn';
import {type Command, useCommandPalette} from './CommandPaletteContext';

const createIntentByEntity: Partial<Record<IntentEntity, Intent>> = {
  transaction: {entity: 'transaction', action: 'create'},
  recurringPayment: {entity: 'recurringPayment', action: 'create'},
  paymentMethod: {entity: 'paymentMethod', action: 'create'},
  category: {entity: 'category', action: 'create'},
  budget: {entity: 'budget', action: 'create'},
  apiKey: {entity: 'apiKey', action: 'create'},
};

const buildEntityIntent = (
  entity: IntentEntity,
  action: Extract<IntentAction, 'edit' | 'delete'>,
  id: string,
): Intent => {
  switch (entity) {
    case 'transaction':
      return {entity, action, id};
    case 'recurringPayment':
      return {entity, action, id};
    case 'paymentMethod':
      return {entity, action, id};
    case 'category':
      return {entity, action, id};
    case 'budget':
      return {entity, action, id};
    case 'attachment':
      return {entity, action: 'delete', id};
    case 'apiKey':
      return {entity, action: 'delete', id};
  }
};

const targetToLeafCommand = (
  entity: IntentEntity,
  action: Extract<IntentAction, 'edit' | 'delete'>,
  option: IntentTargetOption,
  navigateIntent: (intent: Intent) => void,
): Command => ({
  id: `ibn-${action}-${entity}-${option.id}`,
  label: option.label,
  shortcut: option.description,
  section: IBN_TARGETS[entity].pluralLabel,
  keywords: option.keywords,
  onSelect: () => navigateIntent(buildEntityIntent(entity, action, option.id)),
});

export const RegisterIntentCommands: React.FC = () => {
  const {register, unregister} = useCommandPalette();
  const {navigateIntent} = useIntentNavigation();
  const {showSnackbar} = useSnackbarContext();

  React.useEffect(() => {
    const entityCommand = (entity: IntentEntity, action: IntentAction): Command => {
      const config = IBN_TARGETS[entity];
      if (action === 'create' && entity !== 'attachment') {
        return {
          id: `ibn-${action}-${entity}`,
          label: config.label,
          section: 'Entities',
          icon: <EntityIcon entity={entity} />,
          keywords: [config.pluralLabel, entity],
          onSelect: () => {
            const intent = createIntentByEntity[entity];
            if (intent) navigateIntent(intent);
          },
        };
      }
      const resolvedEntity = entity === 'attachment' ? 'transaction' : entity;
      return {
        id: `ibn-${action}-${entity}`,
        label: config.label,
        section: 'Entities',
        icon: <EntityIcon entity={entity} />,
        keywords: [config.pluralLabel, entity],
        placeholder: `Search ${config.label.toLowerCase()}...`,
        emptyLabel: `No matching ${config.pluralLabel.toLowerCase()}`,
        resolve: async query => {
          try {
            const targets = await searchIntentTargets(resolvedEntity, query);
            return targets.map(target =>
              entity === 'attachment'
                ? {
                    id: `ibn-create-attachment-${target.id}`,
                    label: target.label,
                    shortcut: target.description,
                    section: config.pluralLabel,
                    keywords: target.keywords,
                    onSelect: () =>
                      navigateIntent({
                        entity: 'attachment',
                        action: 'create',
                        parentEntity: 'transaction',
                        parentId: target.id,
                      }),
                  }
                : targetToLeafCommand(
                    entity,
                    action as Extract<IntentAction, 'edit' | 'delete'>,
                    target,
                    navigateIntent,
                  ),
            );
          } catch (error) {
            showSnackbar({message: error instanceof Error ? error.message : 'Failed to load targets'});
            return [];
          }
        },
      };
    };

    const entitiesFor = (action: IntentAction) =>
      IBN_ENTITIES.filter(entity =>
        IBN_TARGETS[entity].actions.some(availableAction => availableAction === action),
      ).map(entity => entityCommand(entity, action));
    const commands: Command[] = [
      {
        id: 'ibn-create',
        label: 'Create...',
        section: 'Actions',
        icon: <EntityIcon entity="transaction" />,
        children: entitiesFor('create'),
      },
      {id: 'ibn-edit', label: 'Edit...', section: 'Actions', icon: <EditRounded />, children: entitiesFor('edit')},
      {
        id: 'ibn-delete',
        label: 'Delete...',
        section: 'Actions',
        icon: <DeleteRounded />,
        children: entitiesFor('delete'),
      },
    ];

    register(commands);
    return () => unregister(commands.map(command => command.id));
  }, [navigateIntent, register, showSnackbar, unregister]);

  return null;
};
