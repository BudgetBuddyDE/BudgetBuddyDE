import {
  type TCreatePaymentMethodPayload,
  type TPaymentMethod,
  type TUpdatePaymentMethodPayload,
  ZCreatePaymentMethodPayload,
  ZUpdatePaymentMethodPayload,
} from '@budgetbuddyde/types';
import {Grid2 as Grid, TextField} from '@mui/material';
import React from 'react';
import {DefaultValues} from 'react-hook-form';

import {AppConfig} from '@/app.config';
import {EntityDrawer, type TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import {useAuthContext} from '@/features/Auth';
import {PaymentMethodService, usePaymentMethods} from '@/features/PaymentMethod';
import {useSnackbarContext} from '@/features/Snackbar';

export type TPaymentMethodDrawerValues = {
  id?: TPaymentMethod['id'];
  name: TPaymentMethod['name'] | null;
  address: TPaymentMethod['address'] | null;
  provider: TPaymentMethod['provider'] | null;
  description: TPaymentMethod['description'] | null;
};

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
  const {sessionUser} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {refreshData: refreshPaymentMethods} = usePaymentMethods();

  const handler = {
    async handleSubmit(data: TPaymentMethodDrawerValues, onSuccess: () => void) {
      if (!sessionUser) throw new Error('No session-user not found');

      switch (drawerAction) {
        case 'CREATE':
          try {
            const parsedForm = ZCreatePaymentMethodPayload.safeParse({
              name: data.name,
              address: data.address,
              provider: data.provider,
              description: data.description,
              owner: sessionUser.id,
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const payload: TCreatePaymentMethodPayload = parsedForm.data;

            const record = await PaymentMethodService.createPaymentMethod(payload);

            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshPaymentMethods();
            });
            showSnackbar({message: `Created payment-method #${record.id}`});
          } catch (error) {
            console.error(error);
            showSnackbar({message: (error as Error).message});
          }
          break;

        case 'UPDATE':
          try {
            if (!defaultValues?.id) throw new Error('No payment-method-id found in default-values');

            const parsedForm = ZUpdatePaymentMethodPayload.safeParse({
              name: data.name,
              address: data.address,
              provider: data.provider,
              description: data.description,
              owner: sessionUser.id,
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const payload: TUpdatePaymentMethodPayload = parsedForm.data;

            const record = await PaymentMethodService.updatePaymentMethod(defaultValues.id, payload);

            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshPaymentMethods();
            });
            showSnackbar({message: `Updated payment-method #${record.id}`});
          } catch (error) {
            console.error(error);
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
