'use client';

import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import KeyRounded from '@mui/icons-material/KeyRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import ReceiptRounded from '@mui/icons-material/ReceiptRounded';
import SavingsRounded from '@mui/icons-material/SavingsRounded';
import React from 'react';
import {useSnackbarContext} from '@/components/Snackbar';
import {
  IBN_TARGETS,
  searchIntentTargets,
  type Intent,
  type IntentAction,
  type IntentEntity,
  type IntentTargetOption,
  useIntentNavigation,
} from '@/lib/ibn';
import {type Command, useCommandPalette} from './CommandPaletteContext';

const iconByEntity: Record<IntentEntity, React.ReactNode> = {
  transaction: <ReceiptRounded />,
  recurringPayment: <PaymentsRounded />,
  paymentMethod: <PaymentsRounded />,
  category: <CategoryRounded />,
  budget: <SavingsRounded />,
  attachment: <AttachFileRounded />,
  apiKey: <KeyRounded />,
};

const createIntentByEntity: Partial<Record<IntentEntity, Intent>> = {
  transaction: {entity: 'transaction', action: 'create'},
  recurringPayment: {entity: 'recurringPayment', action: 'create'},
  paymentMethod: {entity: 'paymentMethod', action: 'create'},
  category: {entity: 'category', action: 'create'},
  budget: {entity: 'budget', action: 'create'},
  apiKey: {entity: 'apiKey', action: 'create'},
};

const createEntities = ['transaction', 'recurringPayment', 'paymentMethod', 'category', 'budget', 'apiKey'] as const;
const editEntities = ['transaction', 'recurringPayment', 'paymentMethod', 'category', 'budget'] as const;
const deleteEntities = [
  'transaction',
  'recurringPayment',
  'paymentMethod',
  'category',
  'budget',
  'attachment',
  'apiKey',
] as const;

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
    const resolveTargets =
      (entity: IntentEntity, action: Extract<IntentAction, 'edit' | 'delete'>) => async (query: string) => {
        try {
          const targets = await searchIntentTargets(entity, query);
          return targets.map(target => targetToLeafCommand(entity, action, target, navigateIntent));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load targets';
          showSnackbar({message});
          return [];
        }
      };

    const commands: Command[] = [
      ...createEntities.map(entity => ({
        id: `ibn-create-${entity}`,
        label: `Create ${IBN_TARGETS[entity].label}`,
        section: 'Create',
        icon: iconByEntity[entity],
        keywords: [IBN_TARGETS[entity].pluralLabel, entity],
        onSelect: () => {
          const intent = createIntentByEntity[entity];
          if (intent) navigateIntent(intent);
        },
      })),
      {
        id: 'ibn-create-attachment',
        label: 'Create Attachment...',
        section: 'Create',
        icon: iconByEntity.attachment,
        keywords: ['upload', 'file', 'transaction'],
        emptyLabel: 'No matching transactions',
        resolve: async query => {
          try {
            const targets = await searchIntentTargets('transaction', query);
            return targets.map(target => ({
              id: `ibn-create-attachment-${target.id}`,
              label: target.label,
              shortcut: target.description,
              section: IBN_TARGETS.transaction.pluralLabel,
              keywords: target.keywords,
              onSelect: () =>
                navigateIntent({
                  entity: 'attachment',
                  action: 'create',
                  parentEntity: 'transaction',
                  parentId: target.id,
                }),
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load transactions';
            showSnackbar({message});
            return [];
          }
        },
      },
      ...editEntities.map(entity => ({
        id: `ibn-edit-${entity}`,
        label: `Edit ${IBN_TARGETS[entity].label}...`,
        section: 'Edit',
        icon: <EditRounded />,
        keywords: [IBN_TARGETS[entity].pluralLabel, entity],
        emptyLabel: `No matching ${IBN_TARGETS[entity].pluralLabel.toLowerCase()}`,
        resolve: resolveTargets(entity, 'edit'),
      })),
      ...deleteEntities.map(entity => ({
        id: `ibn-delete-${entity}`,
        label: `Delete ${IBN_TARGETS[entity].label}...`,
        section: 'Delete',
        icon: <DeleteRounded />,
        keywords: [IBN_TARGETS[entity].pluralLabel, entity, 'remove'],
        emptyLabel: `No matching ${IBN_TARGETS[entity].pluralLabel.toLowerCase()}`,
        resolve: resolveTargets(entity, 'delete'),
      })),
    ];

    register(commands);
    return () => unregister(commands.map(command => command.id));
  }, [navigateIntent, register, showSnackbar, unregister]);

  return null;
};
