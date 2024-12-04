import {
  PocketBaseCollection,
  type TCreateStockPositionPayload,
  type TStockPosition,
  type TUpdateStockPositionPayload,
  ZCreateStockPositionPayload,
  ZUpdateStockPositionPayload,
} from '@budgetbuddyde/types';
import {Grid2 as Grid, InputAdornment, TextField} from '@mui/material';
import React from 'react';
import {Controller, DefaultValues} from 'react-hook-form';

import {AppConfig} from '@/app.config';
import {DatePicker} from '@/components/Base/Input';
import {EntityDrawer, type TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {pb} from '@/pocketbase';
import {isRunningOnIOs, parseNumber} from '@/utils';

import {StockAutocomplete, type TStockAutocompleteOption} from '../StockAutocomplete';
import {StockExchangeAutocomplete, type TStockExchangeAutocompleteOption} from '../StockExchange';
import {useStockPositions} from '../hooks';

export type TStockPositionDrawerValues = {
  id?: TStockPosition['id'];
  stock: TStockAutocompleteOption | null;
  exchange: TStockExchangeAutocompleteOption | null;
  bought_at: TStockPosition['bought_at'] | null;
  buy_in: TStockPosition['buy_in'] | null;
  quantity: TStockPosition['quantity'] | null;
  currency: TStockPosition['currency'] | null;
};

export type TStockPositionDrawerProps = TUseEntityDrawerState<TStockPositionDrawerValues> & {
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

export const StockPositionDrawer: React.FC<TStockPositionDrawerProps> = ({
  open,
  drawerAction,
  defaultValues,
  onClose,
  closeOnBackdropClick,
  closeOnEscape,
}) => {
  const {sessionUser} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {refreshData: refreshStockPositions} = useStockPositions();

  const handler = {
    async handleSubmit(data: TStockPositionDrawerValues, onSuccess: () => void) {
      if (!sessionUser) throw new Error('No session-user not found');

      switch (drawerAction) {
        case 'CREATE':
          try {
            const parsedForm = ZCreateStockPositionPayload.safeParse({
              exchange: data.exchange?.value,
              bought_at: data.bought_at,
              isin: data.stock?.isin,
              buy_in: parseNumber(String(data.buy_in)),
              quantity: parseNumber(String(data.quantity)),
              owner: sessionUser.id,
              currency: 'EUR',
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const payload: TCreateStockPositionPayload = parsedForm.data;
            const record = await pb.collection(PocketBaseCollection.STOCK_POSITION).create(payload);

            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshStockPositions();
            });
            showSnackbar({message: `Opened stock position #${record.id}`});
          } catch (error) {
            console.error(error);
            showSnackbar({message: (error as Error).message});
          }
          break;

        case 'UPDATE':
          try {
            if (!defaultValues?.id) throw new Error('No stock-position-id found in default-values');

            const parsedForm = ZUpdateStockPositionPayload.safeParse({
              id: defaultValues.id,
              exchange: data.exchange?.value,
              bought_at: data.bought_at,
              isin: data.stock?.isin,
              buy_in: parseNumber(String(data.buy_in)),
              quantity: parseNumber(String(data.quantity)),
              owner: sessionUser.id,
              currency: 'EUR',
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const payload: TUpdateStockPositionPayload = parsedForm.data;

            const record = await pb.collection(PocketBaseCollection.STOCK_POSITION).update(defaultValues.id, payload);

            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshStockPositions();
            });
            showSnackbar({message: `Updated stock-position #${record.id}`});
          } catch (error) {
            console.error(error);
            showSnackbar({message: (error as Error).message});
          }
          break;
      }
    },
    resetValues() {
      return {
        bought_at: new Date(),
        buy_in: null,
        quantity: null,
        stock: null,
        exchange: null,
        currency: 'EUR',
      } as DefaultValues<TStockPositionDrawerValues>;
    },
  };

  return (
    <EntityDrawer<TStockPositionDrawerValues>
      open={open}
      onClose={onClose}
      onResetForm={handler.resetValues}
      title="Stock Position"
      subtitle={`${drawerAction === 'CREATE' ? 'Open a new' : 'Update an'} stock position`}
      defaultValues={defaultValues}
      onSubmit={handler.handleSubmit}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}>
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
              name="bought_at"
              rules={{required: 'Bought at is required'}}
              defaultValue={defaultValues?.bought_at ?? new Date()}
              render={({field: {onChange, value, ref}}) => (
                <DatePicker
                  value={value}
                  onChange={onChange}
                  onAccept={onChange}
                  inputRef={ref}
                  slotProps={{
                    textField: {
                      label: 'Bought at',
                      error: !!errors.bought_at,
                      helperText: errors.bought_at?.message,
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <Controller
              control={control}
              name="stock"
              defaultValue={null}
              rules={{required: 'Stock is required'}}
              render={({field: {onChange, value}}) => (
                <StockAutocomplete
                  onChange={(_, value) => onChange(value)}
                  value={value}
                  textFieldProps={{
                    label: 'Stock',
                    error: !!errors.exchange,
                    helperText: errors.exchange?.message,
                    required: true,
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <Controller
              control={control}
              name="exchange"
              defaultValue={null}
              rules={{required: 'Stock exchange is required'}}
              render={({field: {onChange, value}}) => (
                <StockExchangeAutocomplete
                  onChange={(_, value) => onChange(value)}
                  value={value}
                  textFieldProps={{
                    label: 'Stock Exchange',
                    error: !!errors.exchange,
                    helperText: errors.exchange?.message,
                    required: true,
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12, md: 6}}>
            <TextField
              label="Quantity"
              {...register('quantity', {required: 'Quantity is required'})}
              error={!!errors.quantity}
              helperText={errors.quantity?.message}
              type="number"
              required
              fullWidth
              slotProps={{
                htmlInput: {inputMode: isRunningOnIOs() ? 'text' : 'numeric'},
              }}
            />
          </Grid>
          <Grid size={{xs: 12, md: 6}}>
            <TextField
              label="Buy in"
              {...register('buy_in', {required: 'Buy in is required'})}
              error={!!errors.buy_in}
              helperText={errors.buy_in?.message}
              type="number"
              required
              fullWidth
              slotProps={{
                input: {startAdornment: <InputAdornment position="start">€</InputAdornment>},
                htmlInput: {inputMode: isRunningOnIOs() ? 'text' : 'numeric'},
              }}
            />
          </Grid>
        </Grid>
      )}
    </EntityDrawer>
  );
};
