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
        label: t('Name'),
        placeholder: t('e.g. Personal automation'),
        required: true,
      },
      {
        type: 'date',
        name: 'expiresAt',
        label: t('Expires at'),
        placeholder: t('Leave empty for no expiration'),
      },
    ],
    [t],
  );

  return (
    <EntityDrawer<ApiKeyFormFields>
      title={t('API Key')}
      subtitle={t('Create new API key')}
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
              <AlertTitle>{t('Handle API keys like passwords')}</AlertTitle>
              {t(
                'An API key acts on behalf of your user account. Store it only in trusted secret managers or server-side environments, never commit it to source control, and delete it immediately if it may have been exposed.',
              )}
            </React.Fragment>
          ),
        },
      }}
    />
  );
};
