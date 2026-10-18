'use client';

import {PaymentMethod, type PaymentMethodVH, type TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {Button} from '@mui/material';
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
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {categorySlice} from '@/lib/features/categories/categorySlice';
import {useAppDispatch} from '@/lib/hooks';
import {translateValidationIssue} from '@/lib/validation/translateValidationIssue';
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
  const t = useAppTranslations();
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
        label: t('paymentMethods.source'),
        placeholder: t('paymentMethods.selectSourcePaymentMethodsToMerge'),
        required: true,
        multiple: true,
        disableCloseOnSelect: true,
        noOptionsText: t('paymentMethods.noPaymentMethodsAvailable'),
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
        label: t('paymentMethods.target'),
        placeholder: t('paymentMethods.selectTargetPaymentMethodToMergeInto'),
        required: true,
        noOptionsText: t('paymentMethods.noPaymentMethodsAvailable'),
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
      const issues: string = parsedPayload.error.issues.map(issue => translateValidationIssue(issue, t)).join(', ');
      showSnackbar({
        message: t('paymentMethods.failedToMergePaymentMethodsIssues', {issues: issues}),
        action: <Button onClick={() => handleSubmit(payload, onSuccess)}>{t('paymentMethods.retry')}</Button>,
      });
      return;
    }

    const [mergedPaymentMethods, error] = await apiClient.backend.paymentMethod.merge(parsedPayload.data);
    if (!mergedPaymentMethods || error) {
      return showSnackbar({
        message: t('paymentMethods.failedToMergePaymentMethodsError', {error: error.message}),
        action: <Button onClick={() => handleSubmit(payload, onSuccess)}>{t('paymentMethods.retry')}</Button>,
      });
    }
    showSnackbar({message: t('paymentMethods.paymentMethodsMerged')});
    onClose(); // close the drawer
    onSuccess?.();
    dispatch(refresh());
  };

  return (
    <EntityDrawer<MergePaymentMethodsForm>
      title={t('paymentMethods.mergePaymentMethods')}
      subtitle={t('paymentMethods.mergeMultiplePaymentMethodsIntoASingleOne')}
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
          children: t(
            'paymentMethods.mergingPaymentMethodsIsIrreversibleAllItemsEGTransactionsOrRecurringPaymentsAssociatedWithTheSourcePaymentMethodsWillBeReassignedToTheTargetPaymentMethod',
          ),
        },
      }}
    />
  );
};
