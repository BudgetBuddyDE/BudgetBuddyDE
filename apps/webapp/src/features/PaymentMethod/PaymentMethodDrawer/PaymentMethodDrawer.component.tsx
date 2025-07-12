import {Grid2 as Grid, TextField} from '@mui/material';
import React from 'react';
import {DefaultValues} from 'react-hook-form';

import {AppConfig} from '@/app.config';
import {EntityDrawer, type TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {CreateOrUpdatePaymentMethod, type NullableFields, type TCreateOrUpdatePaymentMethod} from '@/newTypes';

import {PaymentMethodService} from '../PaymentMethodService';
import {usePaymentMethods} from '../usePaymentMethods.hook';

export type TPaymentMethodDrawerValues = NullableFields<TCreateOrUpdatePaymentMethod>;

export type TPaymentMethodDrawerProps = TUseEntityDrawerState<TPaymentMethodDrawerValues> & {
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

export const PaymentMethodDrawer: React.FC<TPaymentMethodDrawerProps> = ({
  open,
  drawerAction,
  defaultValues,
  onClose,
  closeOnBackdropClick,
  closeOnEscape,
}) => {
  const {session} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {refreshData: refreshPaymentMethods} = usePaymentMethods();

  const handler = {
    async handleSubmit(data: TPaymentMethodDrawerValues, onSuccess: () => void) {
      if (!session) throw new Error('No session-user not found');

      switch (drawerAction) {
        case 'CREATE':
          try {
            const parsedForm = CreateOrUpdatePaymentMethod.safeParse(data);
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await PaymentMethodService.createPaymentMethod(parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshPaymentMethods();
            });
            showSnackbar({message: `Created payment-method #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }
          break;

        case 'UPDATE':
          try {
            const parsedForm = CreateOrUpdatePaymentMethod.safeParse(data);
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await PaymentMethodService.updatePaymentMethod(defaultValues?.ID!, parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshPaymentMethods();
            });
            showSnackbar({message: `Updated payment-method #${record.ID}`});
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
        address: null,
        provider: null,
        description: null,
      } as DefaultValues<TPaymentMethodDrawerValues>;
    },
  };

  return (
    <EntityDrawer<TPaymentMethodDrawerValues>
      open={open}
      onClose={onClose}
      onResetForm={handler.resetValues}
      title="Payment Method"
      subtitle={`${drawerAction === 'CREATE' ? 'Create a new' : 'Update an'} payment-method`}
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
              label="Address"
              {...register('address', {required: 'Address is required'})}
              error={!!errors.address}
              helperText={errors.address?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <TextField
              label="Provider"
              {...register('provider', {required: 'Provider is required'})}
              error={!!errors.provider}
              helperText={errors.provider?.message}
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
