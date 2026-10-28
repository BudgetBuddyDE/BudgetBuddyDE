'use client';

import {AlertTitle} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {EntityDrawer, type EntityDrawerField, type EntityDrawerFormHandler} from '@/components/Drawer';
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
  const t = useTranslations('ApiKeyCreate');
  const fields: EntityDrawerField<ApiKeyFormFields>[] = React.useMemo(
    () => [
      {
        type: 'text',
        name: 'name',
        label: t('name'),
        placeholder: t('namePlaceholder'),
        required: true,
      },
      {
        type: 'date',
        name: 'expiresAt',
        label: t('expiresAt'),
        placeholder: t('neverExpires'),
      },
    ],
    [t],
  );

  return (
    <EntityDrawer<ApiKeyFormFields>
      title={t('title')}
      subtitle={t('subtitle')}
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
              <AlertTitle>{t('warningTitle')}</AlertTitle>
              {t('warningDescription')}
            </React.Fragment>
          ),
        },
      }}
    />
  );
};
