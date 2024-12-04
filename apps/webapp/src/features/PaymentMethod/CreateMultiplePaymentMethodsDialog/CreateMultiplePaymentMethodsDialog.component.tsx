import {type TCreatePaymentMethodPayload, ZCreatePaymentMethodPayload} from '@budgetbuddyde/types';
import {AddRounded, DeleteRounded} from '@mui/icons-material';
import {Box, Button, Grid2 as Grid, IconButton, Stack, TextField} from '@mui/material';
import {LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {RecordModel} from 'pocketbase';
import React from 'react';
import {z} from 'zod';

import {AppConfig} from '@/app.config';
import {FullScreenDialog, type TFullScreenDialogProps} from '@/components/Base/FullScreenDialog';
import {DesktopFeatureOnly} from '@/components/DesktopFeatureOnly';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {useKeyPress} from '@/hooks/useKeyPress';
import {useScreenSize} from '@/hooks/useScreenSize';

import {type TPaymentMethodDrawerValues} from '../PaymentMethodDrawer';
import {PaymentMethodService} from '../PaymentMethodService';
import {usePaymentMethods} from '../usePaymentMethods.hook';

export type TCreateMultiplePaymentMethodsDialogProps = Omit<TFullScreenDialogProps, 'title'>;

type TRow = TPaymentMethodDrawerValues & {
  tempId: number;
};

const DEFAULT_VALUE: () => TRow = () => ({
  tempId: Date.now(),
  name: '',
  address: '',
  provider: '',
  description: '',
});

export const CreateMultiplePaymentMethodsDialog: React.FC<TCreateMultiplePaymentMethodsDialogProps> = ({
  ...dialogProps
}) => {
  const screenSize = useScreenSize();
  const {sessionUser} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {refreshData: refreshPaymentMethods} = usePaymentMethods();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const [form, setForm] = React.useState<TRow[]>([DEFAULT_VALUE()]);

  const handler = {
    close: () => {
      setForm([DEFAULT_VALUE()]);
      dialogProps.onClose();
    },
    addRow: () => setForm(prev => [...prev, DEFAULT_VALUE()]),
    removeRow: (id: number) => setForm(prev => prev.filter(item => item.tempId !== id)),
    changeName: (idx: number, value: string) => {
      setForm(prev => {
        const newForm = [...prev];
        newForm[idx].name = value;
        return newForm;
      });
    },
    changeAddress: (idx: number, value: string) => {
      setForm(prev => {
        const newForm = [...prev];
        newForm[idx].address = value;
        return newForm;
      });
    },
    changeProvider: (idx: number, value: string) => {
      setForm(prev => {
        const newForm = [...prev];
        newForm[idx].provider = value;
        return newForm;
      });
    },
    changeDescription: (idx: number, value: string) => {
      setForm(prev => {
        const newForm = [...prev];
        newForm[idx].description = value;
        return newForm;
      });
    },
    onSubmit: async () => {
      try {
        const parsedForm = z.array(ZCreatePaymentMethodPayload).safeParse(
          form.map(row => ({
            name: row.name,
            address: row.address,
            provider: row.provider,
            description: row.description,
            owner: sessionUser?.id,
          })),
        );
        if (!parsedForm.success) {
          throw parsedForm.error;
        }
        const payload: TCreatePaymentMethodPayload[] = parsedForm.data;
        const submittedPromises = await Promise.allSettled(payload.map(PaymentMethodService.createPaymentMethod));
        const createdPaymentMethods: RecordModel[] = submittedPromises
          .map(promise => (promise.status == 'fulfilled' ? promise.value : null))
          .filter(value => value !== null) as RecordModel[];

        if (createdPaymentMethods.length === 0) {
          throw new Error('No payment-methods were created');
        }

        handler.close();
        React.startTransition(() => {
          refreshPaymentMethods();
        });
        showSnackbar({
          message:
            createdPaymentMethods.length === 1
              ? `Created payment-method #${createdPaymentMethods[0].id}`
              : `Created ${createdPaymentMethods.length} payment-methods`,
        });
      } catch (error) {
        console.error(error);
        showSnackbar({
          message: 'Error while submitting the forms',
          action: (
            <Button size="small" onClick={handler.onSubmit}>
              Retry
            </Button>
          ),
        });
      }
    },
  };

  useKeyPress(
    ['s'],
    e => {
      e.preventDefault();
      handler.onSubmit();
    },
    null,
    true,
  );

  return (
    <FullScreenDialog
      ref={dialogRef}
      title="Create Payment Methods"
      wrapInDialogContent={screenSize !== 'small'}
      {...dialogProps}
      dialogContentProps={{sx: {p: 0}}}
      dialogActionsProps={
        screenSize !== 'small'
          ? {
              sx: {justifyContent: 'unset'},
              children: (
                <Stack
                  direction="row"
                  spacing={AppConfig.baseSpacing}
                  sx={{width: '100%', justifyContent: 'space-between'}}>
                  <Button startIcon={<AddRounded />} onClick={handler.addRow}>
                    Add row
                  </Button>
                  <Box>
                    <Button onClick={handler.close} sx={{mr: 1}}>
                      Cancel
                    </Button>
                    <Button onClick={handler.onSubmit} variant="contained" color="primary">
                      Save
                    </Button>
                  </Box>
                </Stack>
              ),
            }
          : undefined
      }>
      {screenSize !== 'small' ? (
        <form onSubmit={handler.onSubmit}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={AppConfig.baseSpacing}>
              {form.map((row, idx) => (
                <Grid key={row.tempId} container size={{md: 12}} spacing={AppConfig.baseSpacing}>
                  {idx !== 0 && (
                    <Grid size={{md: 0.55}}>
                      <IconButton
                        onClick={() => handler.removeRow(row.tempId)}
                        size="large"
                        sx={{width: '54px', height: '54px'}}>
                        <DeleteRounded />
                      </IconButton>
                    </Grid>
                  )}
                  <Grid size={{md: idx !== 0 ? 2.45 : 3}}>
                    <TextField
                      label="Name"
                      value={row.name}
                      onChange={event => handler.changeName(idx, event.target.value)}
                      fullWidth
                      multiline
                    />
                  </Grid>
                  <Grid size={{md: 3}}>
                    <TextField
                      label="Address"
                      value={row.address}
                      onChange={event => handler.changeAddress(idx, event.target.value)}
                      fullWidth
                      multiline
                    />
                  </Grid>
                  <Grid size={{md: 3}}>
                    <TextField
                      label="Provider"
                      value={row.provider}
                      onChange={event => handler.changeProvider(idx, event.target.value)}
                      fullWidth
                      multiline
                    />
                  </Grid>
                  <Grid size={{md: 3}}>
                    <TextField
                      label="Description"
                      value={row.description}
                      onChange={event => handler.changeDescription(idx, event.target.value)}
                      fullWidth
                      multiline
                    />
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </LocalizationProvider>
        </form>
      ) : (
        <DesktopFeatureOnly
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            p: 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
      )}
    </FullScreenDialog>
  );
};
