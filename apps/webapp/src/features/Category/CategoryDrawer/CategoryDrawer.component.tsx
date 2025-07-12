import {Grid2 as Grid, TextField} from '@mui/material';
import React from 'react';
import {DefaultValues} from 'react-hook-form';

import {AppConfig} from '@/app.config';
import {EntityDrawer, type TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {CreateOrUpdateCategory, type NullableFields, type TCreateOrUpdateCategory} from '@/newTypes';

import {CategoryService} from '../CategoryService';
import {useCategories} from '../useCategories.hook';

export type TCategoryDrawerValues = NullableFields<TCreateOrUpdateCategory>;

export type TCategoryDrawerProps = TUseEntityDrawerState<TCategoryDrawerValues> & {
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

export const CategoryDrawer: React.FC<TCategoryDrawerProps> = ({
  open,
  drawerAction,
  defaultValues,
  onClose,
  closeOnBackdropClick,
  closeOnEscape,
}) => {
  const {session: sessionUser} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {refreshData: refreshCategories} = useCategories();

  const handler = {
    async handleSubmit(data: TCategoryDrawerValues, onSuccess: () => void) {
      if (!sessionUser) throw new Error('No session-user not found');

      switch (drawerAction) {
        case 'CREATE':
          try {
            const parsedForm = CreateOrUpdateCategory.safeParse(data);
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await CategoryService.createCategory(parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshCategories();
            });
            showSnackbar({message: `Created category #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }
          break;

        case 'UPDATE':
          try {
            const parsedForm = CreateOrUpdateCategory.safeParse(data);
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await CategoryService.updateCategory(defaultValues?.ID!, parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshCategories();
            });
            showSnackbar({message: `Updated category #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }
          break;
      }
    },
    resetValues() {
      return {
        name: null,
        description: null,
      } as DefaultValues<TCategoryDrawerValues>;
    },
  };

  return (
    <EntityDrawer<TCategoryDrawerValues>
      open={open}
      onClose={onClose}
      onResetForm={handler.resetValues}
      title="Categories"
      subtitle={`${drawerAction === 'CREATE' ? 'Create a new' : 'Update an'} category`}
      defaultValues={defaultValues}
      onSubmit={handler.handleSubmit}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}>
      {({
        form: {
          register,
          formState: {errors},
        },
      }) => (
        <Grid container spacing={AppConfig.baseSpacing} sx={{p: 2}}>
          <Grid size={{xs: 12}}>
            <TextField
              label="Name"
              {...register('name', {required: 'Name is required'})}
              error={!!errors.name}
              helperText={errors.name?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <TextField
              label="Description"
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      )}
    </EntityDrawer>
  );
};
