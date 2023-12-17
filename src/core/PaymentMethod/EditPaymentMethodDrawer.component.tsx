import { FormDrawer, FormDrawerReducer, generateInitialFormDrawerState } from '@/components/Drawer';
import { TextField } from '@mui/material';
import React from 'react';
import { FormStyle } from '@/style/Form.style';
import {
  ZUpdatePaymentMethodPayload,
  type TPaymentMethod,
  type TUpdatePaymentMethodPayload,
} from '@/types';
import { useAuthContext } from '../Auth';
import { useSnackbarContext } from '../Snackbar';
import { useFetchPaymentMethods, PaymentMethodService } from '.';

export type TEditPaymentMethodProps = {
  open: boolean;
  onChangeOpen: (isOpen: boolean) => void;
  paymentMethod: TPaymentMethod | null;
};

export const EditPaymentMethodDrawer: React.FC<TEditPaymentMethodProps> = ({
  open,
  onChangeOpen,
  paymentMethod,
}) => {
  const { session, authOptions } = useAuthContext();
  const { showSnackbar } = useSnackbarContext();
  const { refresh: refreshPaymentMethods } = useFetchPaymentMethods();
  const [drawerState, setDrawerState] = React.useReducer(
    FormDrawerReducer,
    generateInitialFormDrawerState()
  );
  const [form, setForm] = React.useState<Record<string, string | number | Date>>({});

  const handler = {
    onClose() {
      onChangeOpen(false);
      setForm({});
      setDrawerState({ type: 'RESET' });
    },
    onInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
      setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    },
    async onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!session || !paymentMethod) return;
      setDrawerState({ type: 'SUBMIT' });

      try {
        const parsedForm = ZUpdatePaymentMethodPayload.safeParse({
          ...form,
          id: paymentMethod.id,
        });
        if (!parsedForm.success) throw new Error(parsedForm.error.message);
        const payload: TUpdatePaymentMethodPayload = parsedForm.data;

        const [createdPaymentMethod, error] = await PaymentMethodService.update(
          payload,
          authOptions
        );
        if (error) {
          setDrawerState({ type: 'ERROR', error: error });
          return;
        }
        if (!createdPaymentMethod) {
          setDrawerState({ type: 'ERROR', error: new Error("Couldn't save the applied changes") });
          return;
        }

        setDrawerState({ type: 'SUCCESS' });
        handler.onClose();
        refreshPaymentMethods(); // FIXME: Wrap inside startTransition
        showSnackbar({ message: `Saved applied changes for ${payload.name}` });
      } catch (error) {
        console.error(error);
        setDrawerState({ type: 'ERROR', error: error as Error });
      }
    },
  };

  React.useEffect(() => {
    if (!paymentMethod) return;
    setForm({
      name: paymentMethod.name,
      address: paymentMethod.address,
      provider: paymentMethod.provider,
      description: paymentMethod.description ?? '',
    });
  }, [paymentMethod]);

  return (
    <FormDrawer
      state={drawerState}
      open={open}
      onSubmit={handler.onFormSubmit}
      heading="Edit Payment-Method"
      onClose={() => {
        onChangeOpen(false);
        setForm({});
        setDrawerState({ type: 'RESET' });
      }}
      closeOnBackdropClick
    >
      {(['name', 'address', 'provider'] as Partial<keyof TUpdatePaymentMethodPayload>[]).map(
        (name) => {
          return (
            <TextField
              key={'payment-method-' + name}
              id={'payment-method-' + name}
              variant="outlined"
              label={name.charAt(0).toUpperCase() + name.slice(1)}
              name={name}
              sx={FormStyle}
              onChange={handler.onInputChange}
              value={form[name]}
              required
            />
          );
        }
      )}

      <TextField
        id="payment-method-description"
        variant="outlined"
        label="Description"
        name="description"
        sx={{ ...FormStyle, mb: 0 }}
        multiline
        rows={3}
        onChange={handler.onInputChange}
        value={form.description}
      />
    </FormDrawer>
  );
};
