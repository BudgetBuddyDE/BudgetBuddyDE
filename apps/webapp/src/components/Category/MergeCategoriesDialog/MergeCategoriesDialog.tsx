'use client';

import {Category, type CategoryVH, type TCategoryVH} from '@budgetbuddyde/api/category';
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

export type MergeCategoriesForm = FirstLevelNullable<{
  sourceCategories: TCategoryVH[];
  targetCategory: TCategoryVH;
}>;

export type MergeCategoriesDialogProps = {
  source: z.infer<typeof CategoryVH>[];
  isOpen: boolean;
  onClose: () => void;
};

export const MergeCategoriesDialog: React.FC<MergeCategoriesDialogProps> = ({source, isOpen, onClose}) => {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();
  const {refresh} = categorySlice.actions;
  const dispatch = useAppDispatch();

  const defaultValues: EntityDrawerProps<MergeCategoriesForm>['defaultValues'] = React.useMemo(() => {
    return {
      sourceCategories: source,
      targetCategory: null,
    };
  }, [source]);

  const fields: EntityDrawerField<MergeCategoriesForm>[] = React.useMemo(() => {
    return [
      {
        type: 'autocomplete',
        name: 'sourceCategories',
        label: t('Source'),
        placeholder: t('Select source categories to merge'),
        required: true,
        multiple: true,
        disableCloseOnSelect: true,
        noOptionsText: t('No categories available'),
        async retrieveOptionsFunc(_keywords) {
          const [categories, error] = await apiClient.backend.category.getValueHelp();
          if (error) {
            logger.error('Failed to fetch category options', error);
            return [];
          }
          return categories ?? [];
        },
        getOptionLabel(option: TCategoryVH) {
          return option.name;
        },
        isOptionEqualToValue(option: TCategoryVH, value: TCategoryVH) {
          return option.id === value.id;
        },
      },
      {
        type: 'autocomplete',
        name: 'targetCategory',
        label: t('Target'),
        placeholder: t('Select target category to merge into'),
        required: true,
        noOptionsText: t('No categories available'),
        async retrieveOptionsFunc(_keywords) {
          const [categories, error] = await apiClient.backend.category.getValueHelp();
          if (error) {
            logger.error('Failed to fetch category options', error);
            return [];
          }
          return categories ?? [];
        },
        getOptionLabel(option: TCategoryVH) {
          return option.name;
        },
        isOptionEqualToValue(option: TCategoryVH, value: TCategoryVH) {
          return option.id === value.id;
        },
      },
    ] as EntityDrawerField<MergeCategoriesForm>[];
  }, [t]);

  const handleSubmit: EntityDrawerFormHandler<MergeCategoriesForm> = async (payload, onSuccess) => {
    const parsedPayload = z
      .object({
        source: z.array(Category.shape.id),
        target: Category.shape.id,
      })
      .safeParse({
        source: payload.sourceCategories?.map(cat => cat.id),
        target: payload.targetCategory?.id,
      });
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => translateValidationIssue(issue, t)).join(', ');
      showSnackbar({
        message: t('Failed to merge categories: {issues}', {issues: issues}),
        action: <Button onClick={() => handleSubmit(payload, onSuccess)}>{t('Retry')}</Button>,
      });
      return;
    }

    const [mergedCategories, error] = await apiClient.backend.category.merge(parsedPayload.data);
    if (!mergedCategories || error) {
      return showSnackbar({
        message: t('Failed to merge categories: {error}', {error: error.message}),
        action: <Button onClick={() => handleSubmit(payload, onSuccess)}>{t('Retry')}</Button>,
      });
    }
    showSnackbar({message: t('Categories merged')});
    onClose(); // close the drawer
    onSuccess?.();
    dispatch(refresh());
  };

  return (
    <EntityDrawer<MergeCategoriesForm>
      title={t('Merge categories')}
      subtitle={t('Merge multiple categories into a single one.')}
      open={isOpen}
      onSubmit={handleSubmit}
      onClose={onClose}
      closeOnBackdropClick
      onResetForm={() => {
        return {
          sourceCategories: [],
          targetCategory: null,
        };
      }}
      defaultValues={defaultValues}
      fields={fields}
      slots={{
        alert: {
          variant: 'standard',
          severity: 'warning',
          children: t(
            'Merging categories is irreversible. All items (e.g. transactions or recurring payments) associated with the source categories will be reassigned to the target category.',
          ),
        },
      }}
    />
  );
};
