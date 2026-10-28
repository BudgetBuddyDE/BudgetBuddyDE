'use client';

import {PaymentMethod, type PaymentMethodVH, type TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {Button} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import z from 'zod';
import {apiClient} from '@/apiClient';
import {
  EntityDrawer,
  type EntityDrawerField,
  type EntityDrawerFormHandler,
  type EntityDrawerProps,
  type FirstLevelNullable,
} from '@/components/Drawer';
import {useSnackbarContext} from '@/components/Snackbar';
import {categorySlice} from '@/lib/features/categories/categorySlice';
import {useAppDispatch} from '@/lib/hooks';
import {logger} from '@/logger';

export type MergePaymentMethodsForm = FirstLevelNullable<{
  sourcePaymentMethods: TPaymentMethodVH[];
  targetPaymentMethod: TPaymentMethodVH;
}>;

export type MergePaymentMethodsDialogProps = {
  source: z.infer<typeof PaymentMethodVH>[];
  isOpen: boolean;
  onClose: () => void;
};

export const MergePaymentMethodsDialog: React.FC<MergePaymentMethodsDialogProps> = ({source, isOpen, onClose}) => {
  const t = useTranslations('MergeDialog');
  const {showSnackbar} = useSnackbarContext();
  const {refresh} = categorySlice.actions;
  const dispatch = useAppDispatch();

  const defaultValues: EntityDrawerProps<MergePaymentMethodsForm>['defaultValues'] = React.useMemo(() => {
    return {
      sourcePaymentMethods: source,
      targetPaymentMethod: null,
    };
  }, [source]);

  const fields: EntityDrawerField<MergePaymentMethodsForm>[] = React.useMemo(() => {
    return [
      {
        type: 'autocomplete',
        name: 'sourcePaymentMethods',
        label: t('source'),
        placeholder: t('selectSourcePaymentMethods'),
        required: true,
        multiple: true,
        disableCloseOnSelect: true,
        noOptionsText: t('noPaymentMethodsAvailable'),
        async retrieveOptionsFunc(_keywords) {
          const [paymentMethods, error] = await apiClient.backend.paymentMethod.getValueHelp();
          if (error) {
            logger.error('Failed to fetch payment method options', error);
            return [];
          }
          return paymentMethods ?? [];
        },
        getOptionLabel(option: TPaymentMethodVH) {
          return option.name;
        },
        isOptionEqualToValue(option: TPaymentMethodVH, value: TPaymentMethodVH) {
          return option.id === value.id;
        },
      },
      {
        type: 'autocomplete',
        name: 'targetPaymentMethod',
        label: t('target'),
        placeholder: t('selectTargetPaymentMethod'),
        required: true,
        noOptionsText: t('noPaymentMethodsAvailable'),
        async retrieveOptionsFunc(_keywords) {
          const [paymentMethods, error] = await apiClient.backend.paymentMethod.getValueHelp();
          if (error) {
            logger.error('Failed to fetch payment method options', error);
            return [];
          }
          return paymentMethods ?? [];
        },
        getOptionLabel(option: TPaymentMethodVH) {
          return option.name;
        },
        isOptionEqualToValue(option: TPaymentMethodVH, value: TPaymentMethodVH) {
          return option.id === value.id;
        },
      },
    ] as EntityDrawerField<MergePaymentMethodsForm>[];
  }, [t]);

  const handleSubmit: EntityDrawerFormHandler<MergePaymentMethodsForm> = async (payload, onSuccess) => {
    const parsedPayload = z
      .object({
        source: z.array(PaymentMethod.shape.id),
        target: PaymentMethod.shape.id,
      })
      .safeParse({
        source: payload.sourcePaymentMethods?.map(cat => cat.id),
        target: payload.targetPaymentMethod?.id,
      });
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => issue.message).join(', ');
      showSnackbar({
        message: t('paymentMethodMergeFailed', {error: issues}),
        action: <Button onClick={() => handleSubmit(payload, onSuccess)}>{t('retry')}</Button>,
      });
      return;
    }

    const [mergedPaymentMethods, error] = await apiClient.backend.paymentMethod.merge(parsedPayload.data);
    if (!mergedPaymentMethods || error) {
      return showSnackbar({
        message: t('paymentMethodMergeFailed', {error: error.message}),
        action: <Button onClick={() => handleSubmit(payload, onSuccess)}>{t('retry')}</Button>,
      });
    }
    showSnackbar({message: t('paymentMethodsMerged')});
    onClose(); // close the drawer
    onSuccess?.();
    dispatch(refresh());
  };

  return (
    <EntityDrawer<MergePaymentMethodsForm>
      title={t('mergePaymentMethods')}
      subtitle={t('mergePaymentMethodsDescription')}
      open={isOpen}
      onSubmit={handleSubmit}
      onClose={onClose}
      closeOnBackdropClick
      onResetForm={() => {
        return {
          sourcePaymentMethods: [],
          targetPaymentMethod: null,
        };
      }}
      defaultValues={defaultValues}
      fields={fields}
      slots={{
        alert: {
          variant: 'standard',
          severity: 'warning',
          children:
            'Merging payment methods is irreversible. All items (e.g. transactions or recurring payments) associated with the source payment methods will be reassigned to the target payment method.',
        },
      }}
    />
  );
};
