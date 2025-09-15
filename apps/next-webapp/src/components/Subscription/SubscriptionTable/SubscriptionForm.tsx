'use client';

import { DatePicker } from '@/components/Form/DatePicker';
import { isRunningOnIOs } from '@/utils/determineOS';
import { Button, Chip, createFilterOptions, Grid, TextField } from '@mui/material';
import React from 'react';
import { Controller, type FieldValues, DefaultValues, useForm } from 'react-hook-form';
import { SubscriptionFormFields } from './SubscriptionTable';
import { type TCategory_VH, type TPaymentMethod_VH, type TReceiverVH } from '@/types';
import { Autocomplete } from '@/components/Form/Autocomplete';
import { logger } from '@/logger';
import { CategoryService } from '@/services/Category.service';
import { TransactionService } from '@/services/Transaction.service';
import { PaymentMethodService } from '@/services/PaymentMethod.service';
import { type FirstLevelNullable } from '@/components/Drawer';

export type SubscriptionFormProps<T extends FieldValues> = {
  defaultValues?: FirstLevelNullable<DefaultValues<T>>;
};

export const SubscriptionForm = ({
  defaultValues,
}: SubscriptionFormProps<SubscriptionFormFields>) => {
  const form = useForm<SubscriptionFormFields>({ defaultValues });
  const [formData, setFormData] = React.useState<any>(null);

  const handleReset = () => {
    console.log('Resetting form...');
    console.log(defaultValues);
    form.reset({
      executeAt: new Date(),
      toCategory: null,
      toPaymentMethod: null,
      receiver: null,
      // @ts-expect-error REVITIS: Improve typing
      transferAmount: "",
      information: null,
    });
    console.log('Form after reset:', form.getValues());
  };

  return (
    <React.Fragment>
      {formData && <pre>{JSON.stringify(formData, null, 2)}</pre>}
      <form
        onSubmit={form.handleSubmit((data) => setFormData(data))}
        onReset={handleReset}
        noValidate
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="executeAt"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  inputRef={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onAccept={field.onChange}
                  slotProps={{
                    textField: {
                      ...form.register('executeAt', { required: 'Execute date is required' }),
                      required: true,
                      label: 'Execute At',
                      error: !!error,
                      helperText: error ? error.message : null,
                      fullWidth: true,
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="toCategory"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  {...field}
                  label="Category"
                  placeholder='e.g. "Subscriptions"'
                  value={field.value}
                  onChange={(e, data) => {
                    console.log('Category changed:', e, data);
                    field.onChange(data);
                  }}
                  defaultValue={(defaultValues?.toCategory as TCategory_VH) || undefined}
                  retrieveOptionsFunc={async () => {
                    const [categories, error] = await CategoryService.getCategoryVH();
                    if (error) {
                      logger.error('Failed to fetch category options:', error);
                      return [];
                    }
                    return categories ?? [];
                  }}
                  getOptionLabel={(option) => option.name}
                  required
                  error={!!error}
                  helperText={error ? error.message : null}
                  fullWidth
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="toPaymentMethod"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  {...field}
                  label="Payment Method"
                  placeholder='e.g. "Credit Card"'
                  value={field.value}
                  onChange={(e, data) => {
                    console.log('Payment Method changed:', e, data);
                    field.onChange(data);
                  }}
                  defaultValue={(defaultValues?.toPaymentMethod as TPaymentMethod_VH) || undefined}
                  retrieveOptionsFunc={async () => {
                    const [paymentMethods, error] = await PaymentMethodService.getPaymentMethodVH();
                    if (error) {
                      logger.error('Failed to fetch payment method options:', error);
                      return [];
                    }
                    return paymentMethods ?? [];
                  }}
                  getOptionLabel={(option) => option.name}
                  required
                  error={!!error}
                  helperText={error ? error.message : null}
                  fullWidth
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="receiver"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  {...field}
                  label="Receiver"
                  placeholder='e.g. "Netflix"'
                  onChange={(_, data) => field.onChange(data)}
                  defaultValue={defaultValues?.receiver as TReceiverVH}
                  retrieveOptionsFunc={async () => {
                    const [categories, error] = await TransactionService.getReceiverVH();
                    if (error) {
                      logger.error('Failed to fetch receiver options:', error);
                      return [];
                    }
                    return categories ?? [];
                  }}
                  filterOptions={(options, state) => {
                    if (state.inputValue.length < 1) return options;
                    const filter = createFilterOptions<(typeof options)[0]>({ ignoreCase: true });
                    const filtered = filter(options, state);
                    return filtered.length > 0
                      ? filtered
                      : [
                          {
                            new: true,
                            receiver: state.inputValue,
                          },
                        ];
                  }}
                  renderOption={(props, option: SubscriptionFormFields['receiver']) => {
                    if (!option) return null;
                    const isNew = 'new' in option;
                    return (
                      <li {...props} key={option.receiver}>
                        {isNew && <Chip label="New" size="small" sx={{ mr: 0.5 }} />}
                        {option.receiver}
                      </li>
                    );
                  }}
                  noOptionsText="No receivers found"
                  getOptionLabel={(option) => option.receiver}
                  required
                  error={!!error}
                  helperText={error ? error.message : null}
                  fullWidth
                />
              )}
            />
          </Grid>
          {/* <Grid size={{ xs: 12 }}>
            <Controller
              name="receiver"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  defaultValue={(defaultValues?.receiver as TReceiverVH) || null}
                  options={[
                    { receiver: 'Penny' },
                    { receiver: 'Amazon' },
                    { receiver: 'Landlord' },
                    { receiver: 'MediaMarkt' },
                    { receiver: 'Hubert' },
                    { receiver: 'John Doe' },
                  ]}
                  getOptionLabel={(option) => option.receiver}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      {...form.register('receiver', { required: 'Receiver is required' })}
                      // required
                      // label={'Receiver'}
                      // placeholder={'e.g. "Netflix"'}
                      // variant="outlined"
                      // error={!!error}
                      // helperText={error ? error.message : null}
                      fullWidth
                    />
                  )}
                  onChange={(e, data) => {
                    console.log(data);
                    field.onChange(data);
                  }}
                />
              )}
              // //onChange={([, data]) => data}
              // defaultValue={{
              //   code: 'AF',
              //   label: 'Afghanistan',
              //   phone: '93',
              // }}
            />
          </Grid> */}
          <Grid size={{ xs: 12 }}>
            {/* <Controller
              name="transferAmount"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  {...form.register('transferAmount', { required: 'Transfer amount is required' })}
                  required
                  type="number"
                  slotProps={{
                    htmlInput: { inputMode: isRunningOnIOs() ? 'text' : 'numeric' },
                  }}
                  error={!!error}
                  helperText={error ? error.message : null}
                  label="Transfer Amount"
                  placeholder='e.g. "10.99"'
                  fullWidth
                />
              )}
            /> */}
            <Controller
              name="transferAmount"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  {...form.register('transferAmount', { required: 'Transfer Amount is required' })}
                  type="number"
                  error={!!error}
                  helperText={error ? error.message : null}
                  label="Transfer Amount"
                  placeholder='e.g. "10.99"'
                  fullWidth
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="information"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  {...form.register('information')}
                  type="text"
                  error={!!error}
                  helperText={error ? error.message : null}
                  label="Information"
                  placeholder='e.g. "Netflix subscription"'
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />
          </Grid>
          <Grid container size={{ xs: 6 }} spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Button type="reset" fullWidth>
                Reset
              </Button>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Button type="submit" fullWidth variant="contained">
                Submit
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </React.Fragment>
  );
};
