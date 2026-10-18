'use client';

import {AlertTitle} from '@mui/material';
import React from 'react';
import {EntityDrawer, type EntityDrawerField, type EntityDrawerFormHandler} from '@/components/Drawer';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import type {ApiKeyFormFields} from './types';

export type ApiKeyCreateDrawerProps = {
  open: boolean;
  isLoading: boolean;
  defaultValues?: ApiKeyFormFields;
  onClose: () => void;
  onSubmit: EntityDrawerFormHandler<ApiKeyFormFields>;
};

export const ApiKeyCreateDrawer: React.FC<ApiKeyCreateDrawerProps> = ({
  open,
  isLoading,
  defaultValues,
  onClose,
  onSubmit,
}) => {
  const t = useAppTranslations();
  const fields: EntityDrawerField<ApiKeyFormFields>[] = React.useMemo(
    () => [
      {
        type: 'text',
        name: 'name',
        label: t('account.apiKeys.name'),
        placeholder: t('account.apiKeys.eGPersonalAutomation'),
        required: true,
      },
      {
        type: 'date',
        name: 'expiresAt',
        label: t('account.apiKeys.expiresAt'),
        placeholder: t('account.apiKeys.leaveEmptyForNoExpiration'),
      },
    ],
    [t],
  );

  return (
    <EntityDrawer<ApiKeyFormFields>
      title={t('account.apiKeys.apiKey')}
      subtitle={t('account.apiKeys.createNewAPIKey')}
      open={open}
      onSubmit={onSubmit}
      onClose={onClose}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
      isLoading={isLoading}
      onResetForm={() => ({
        name: null,
        expiresAt: null,
      })}
      defaultValues={defaultValues}
      fields={fields}
      slots={{
        alert: {
          severity: 'warning',
          children: (
            <React.Fragment>
              <AlertTitle>{t('account.apiKeys.handleAPIKeysLikePasswords')}</AlertTitle>
              {t('account.apiKeys.securityGuidance')}
            </React.Fragment>
          ),
        },
      }}
    />
  );
};
