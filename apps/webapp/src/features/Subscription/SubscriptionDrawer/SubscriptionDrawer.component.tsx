import {Grid2 as Grid, InputAdornment, TextField} from '@mui/material';
import React from 'react';
import {Controller, DefaultValues} from 'react-hook-form';

import {AppConfig} from '@/app.config';
import {DatePicker, ReceiverAutocomplete, type TReceiverAutocompleteOption} from '@/components/Base/Input';
import {EntityDrawer, type TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import {useAuthContext} from '@/features/Auth';
import {CategoryAutocomplete, type TCategoryAutocompleteOption} from '@/features/Category';
import {PaymentMethodAutocomplete, type TPaymentMethodAutocompleteOption} from '@/features/PaymentMethod';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {CreateOrUpdateSubscription, type NullableFields, type TCreateOrUpdateSubscription} from '@/newTypes';
import {isRunningOnIOs, parseNumber} from '@/utils';

import {SubscriptionService} from '../SubscriptionService';
import {useSubscriptions} from '../useSubscriptions.hook';

export type TSusbcriptionDrawerValues = {
  receiverOption: TReceiverAutocompleteOption | null;
  categoryOption: TCategoryAutocompleteOption | null;
  paymentMethodOption: TPaymentMethodAutocompleteOption | null;
  executeAt: Date | null;
} & Pick<
  NullableFields<TCreateOrUpdateSubscription>,
  'ID' | 'paused' | 'toCategory_ID' | 'toPaymentMethod_ID' | 'receiver' | 'transferAmount' | 'information'
>;

export type TSubscriptionDrawerProps = TUseEntityDrawerState<TSusbcriptionDrawerValues> & {
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

export const SubscriptionDrawer: React.FC<TSubscriptionDrawerProps> = ({
  open,
  drawerAction,
  defaultValues,
  onClose,
  closeOnBackdropClick,
  closeOnEscape,
}) => {
  const {session} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {refreshData: refreshSubscriptions} = useSubscriptions();

  const handler = {
    async handleSubmit(data: TSusbcriptionDrawerValues, onSuccess: () => void) {
      if (!session) throw new Error('No session-user not found');

      switch (drawerAction) {
        case 'CREATE':
          try {
            const parsedForm = CreateOrUpdateSubscription.safeParse({
              ...data,
              executeAt: data.executeAt!.getDate(),
              receiver: data.receiverOption?.value,
              toCategory_ID: data.categoryOption?.ID,
              toPaymentMethod_ID: data.paymentMethodOption?.ID,
              transferAmount: parseNumber(String(data.transferAmount)),
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await SubscriptionService.createSubscription(parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshSubscriptions();
            });
            showSnackbar({message: `Created subscription #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }

          break;

        case 'UPDATE':
          try {
            const parsedForm = CreateOrUpdateSubscription.safeParse({
              ...data,
              executeAt: data.executeAt!.getDate(),
              receiver: data.receiverOption?.value,
              toCategory_ID: data.categoryOption?.ID,
              toPaymentMethod_ID: data.paymentMethodOption?.ID,
              transferAmount: parseNumber(String(data.transferAmount)),
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await SubscriptionService.updateSubscription(defaultValues?.ID!, parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshSubscriptions();
            });
            showSnackbar({message: `Updated subscription #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }
          break;
      }
    },
    resetValues() {
      return {
        paused: false,
        executeAt: new Date(),
        receiver: null,
        receiverOption: null,
        toPaymentMethod_ID: null,
        toCategory_ID: null,
        categoryOption: null,
        paymentMethodOption: null,
        transferAmount: null,
        information: null,
      } as DefaultValues<TSusbcriptionDrawerValues>;
    },
  };

  return (
    <EntityDrawer<TSusbcriptionDrawerValues>
      open={open}
      onClose={onClose}
      onResetForm={handler.resetValues}
      title="Subscription"
      subtitle={drawerAction === 'CREATE' ? 'Create a new subscription' : 'Update subscription'}
      defaultValues={defaultValues}
      onSubmit={handler.handleSubmit}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
      isLoading={false}>
      {({
        form: {
          register,
          formState: {errors},
          control,
        },
      }) => (
        <Grid container spacing={AppConfig.baseSpacing} sx={{p: 2}}>
          <Grid size={{xs: 12}}>
            <Controller
              control={control}
              name="executeAt"
              rules={{required: 'Process date is required'}}
              defaultValue={defaultValues?.executeAt ? new Date(defaultValues.executeAt) : new Date()}
              render={({field: {onChange, value, ref}}) => (
                <DatePicker
                  value={value}
                  onChange={onChange}
                  onAccept={onChange}
                  inputRef={ref}
                  slotProps={{
                    textField: {
                      label: 'Execute at',
                      error: !!errors.executeAt,
                      helperText: errors.executeAt?.message,
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12, md: 6}}>
            <Controller
              control={control}
              name="categoryOption"
              defaultValue={null}
              rules={{required: 'Category is required'}}
              render={({field: {onChange, value}}) => (
                <CategoryAutocomplete
                  onChange={(_, value) => onChange(value)}
                  value={value}
                  textFieldProps={{
                    label: 'Category',
                    error: !!errors.categoryOption,
                    helperText: errors.categoryOption?.message,
                    required: true,
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12, md: 6}}>
            <Controller
              control={control}
              name="paymentMethodOption"
              defaultValue={null}
              rules={{required: 'Payment-Method is required'}}
              render={({field: {onChange, value}}) => (
                <PaymentMethodAutocomplete
                  onChange={(_, value) => onChange(value)}
                  value={value}
                  textFieldProps={{
                    label: 'Payment Method',
                    error: !!errors.paymentMethodOption,
                    helperText: errors.paymentMethodOption?.message,
                    required: true,
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <Controller
              control={control}
              name="receiverOption"
              defaultValue={null}
              rules={{required: 'Receiver is required'}}
              render={({field: {onChange, value}}) => (
                <ReceiverAutocomplete
                  onChange={(_, value) => onChange(value)}
                  value={value}
                  textFieldProps={{
                    label: 'Receiver',
                    error: !!errors.receiverOption,
                    helperText: errors.receiverOption?.message,
                    required: true,
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <TextField
              label="Amount"
              {...register('transferAmount', {required: 'Transfer amount is required'})}
              error={!!errors.transferAmount}
              helperText={errors.transferAmount?.message}
              type="number"
              required
              fullWidth
              slotProps={{
                input: {startAdornment: <InputAdornment position="start">€</InputAdornment>},
                htmlInput: {inputMode: isRunningOnIOs() ? 'text' : 'numeric'},
              }}
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <TextField
              label="Information"
              {...register('information')}
              error={!!errors.information}
              helperText={errors.information?.message}
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
