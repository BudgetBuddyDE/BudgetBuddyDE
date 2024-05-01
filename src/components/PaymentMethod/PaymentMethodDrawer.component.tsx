import {
  ZCreatePaymentMethodPayload,
  ZUpdatePaymentMethodPayload,
  type TCreatePaymentMethodPayload,
  type TPaymentMethod,
  type TUpdatePaymentMethodPayload,
} from '@budgetbuddyde/types';
import {EntityDrawer, type TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import React from 'react';
import {useAuthContext} from '@/components/Auth';
import {useSnackbarContext} from '@/components/Snackbar';
import {PaymentMethodService, useFetchPaymentMethods} from '@/components/PaymentMethod';
import {Grid, TextField} from '@mui/material';

export type TPaymentMethodDrawerValues = {
  id?: TPaymentMethod['id'];
} & Pick<TPaymentMethod, 'address' | 'provider' | 'name' | 'description'>;

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
  const {refresh: refreshPaymentMethods} = useFetchPaymentMethods();

  const handler = {
    async handleSubmit(data: TPaymentMethodDrawerValues) {
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
  };

  return (
    <EntityDrawer<TPaymentMethodDrawerValues>
      open={open}
      onClose={onClose}
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
        <Grid container spacing={2} sx={{p: 2}}>
          <Grid item xs={12} md={12}>
            <TextField
              label="Name"
              {...register('name', {required: 'Name is required'})}
              error={!!errors.name}
              helperText={errors.name?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <TextField
              label="Address"
              {...register('address', {required: 'Address is required'})}
              error={!!errors.address}
              helperText={errors.address?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <TextField
              label="Provider"
              {...register('provider', {required: 'Provider is required'})}
              error={!!errors.provider}
              helperText={errors.provider?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={12}>
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
