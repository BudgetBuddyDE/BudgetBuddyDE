import {Grid2 as Grid, InputAdornment, TextField} from '@mui/material';
import React from 'react';
import {Controller, DefaultValues} from 'react-hook-form';

import {AppConfig} from '@/app.config';
import {DatePicker, ReceiverAutocomplete, TReceiverAutocompleteOption} from '@/components/Base/Input';
import {EntityDrawer, type TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import {useAuthContext} from '@/features/Auth';
import {CategoryAutocomplete, TCategoryAutocompleteOption} from '@/features/Category';
import {PaymentMethodAutocomplete, TPaymentMethodAutocompleteOption} from '@/features/PaymentMethod';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {CreateOrUpdateTransaction, NullableFields, type TCreateOrUpdateTransaction} from '@/newTypes';
import {isRunningOnIOs, parseNumber} from '@/utils';

import {TransactionService} from '../TransactionService';
import {useTransactions} from '../useTransactions.hook';

export type TTransactionDrawerValues = NullableFields<{
  receiverAutocomplete: TReceiverAutocompleteOption;
  categoryAutocomplete: TCategoryAutocompleteOption;
  paymentMethodAutocomplete: TPaymentMethodAutocompleteOption;
}> &
  Pick<
    NullableFields<TCreateOrUpdateTransaction>,
    'ID' | 'processedAt' | 'toCategory_ID' | 'toPaymentMethod_ID' | 'receiver' | 'transferAmount' | 'information'
  >;

export type TTransactionDrawerProps = TUseEntityDrawerState<TTransactionDrawerValues> & {
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

export const TransactionDrawer: React.FC<TTransactionDrawerProps> = ({
  open,
  drawerAction,
  defaultValues,
  onClose,
  closeOnBackdropClick,
  closeOnEscape,
}) => {
  const {session} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {refreshData: refreshTransactions} = useTransactions();
  // const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  // const [filePreview, setFilePreview] = React.useState<(File & {buffer?: string | ArrayBuffer | null})[]>([]);

  const handler = {
    onFileUpload(_files: FileList) {
      // setUploadedFiles(Array.from(files));
    },
    async handleSubmit(data: TTransactionDrawerValues, onSuccess: () => void) {
      if (!session) throw new Error('No session-user not found');

      switch (drawerAction) {
        case 'CREATE':
          try {
            const parsedForm = CreateOrUpdateTransaction.safeParse({
              ...data,
              receiver: data.receiverAutocomplete?.value,
              toCategory_ID: data.categoryAutocomplete?.ID,
              toPaymentMethod_ID: data.paymentMethodAutocomplete?.ID,
              transferAmount: parseNumber(String(data.transferAmount)),
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await TransactionService.createTransaction(parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshTransactions();
            });
            showSnackbar({message: `Created transaction #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }
          break;

        case 'UPDATE':
          try {
            const parsedForm = CreateOrUpdateTransaction.safeParse({
              ...data,
              receiver: data.receiverAutocomplete?.value,
              toCategory_ID: data.categoryAutocomplete?.ID,
              toPaymentMethod_ID: data.paymentMethodAutocomplete?.ID,
              transferAmount: parseNumber(String(data.transferAmount)),
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await TransactionService.updateTransaction(defaultValues?.ID!, parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshTransactions();
            });
            showSnackbar({message: `Updated transaction #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }
          break;
      }
    },
    resetValues() {
      // setUploadedFiles([]);
      return {
        processedAt: new Date(),
        receiver: null,
        toPaymentMethod_ID: null,
        toCategory_ID: null,
        transferAmount: null,
        information: null,
        receiverAutocomplete: null,
        categoryAutocomplete: null,
        paymentMethodAutocomplete: null,
      } as DefaultValues<TTransactionDrawerValues>;
    },
  };

  // React.useEffect(() => {
  //   for (const file of uploadedFiles) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       const url = reader.result?.toString() ?? '';
  //       // @ts-ignore
  //       file['buffer'] = url;
  //       setFilePreview(prev => [...prev, file]);
  //     };

  //     if (file) reader.readAsDataURL(file);
  //   }

  //   return () => {
  //     setFilePreview([]);
  //   };
  // }, [uploadedFiles]);

  return (
    <EntityDrawer<TTransactionDrawerValues>
      open={open}
      onClose={onClose}
      onResetForm={handler.resetValues}
      title="Transaction"
      subtitle={`${drawerAction === 'CREATE' ? 'Create a new' : 'Update an'} transaction`}
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
              name="processedAt"
              rules={{required: 'Process date is required'}}
              defaultValue={defaultValues?.processedAt ?? new Date()}
              render={({field: {onChange, value, ref}}) => (
                <DatePicker
                  value={value}
                  onChange={onChange}
                  onAccept={onChange}
                  inputRef={ref}
                  slotProps={{
                    textField: {
                      label: 'Processed at',
                      error: !!errors.processedAt,
                      helperText: errors.processedAt?.message,
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
              name="categoryAutocomplete"
              defaultValue={null}
              rules={{required: 'Category is required'}}
              render={({field: {onChange, value}}) => (
                <CategoryAutocomplete
                  onChange={(_, value) => onChange(value)}
                  value={value}
                  textFieldProps={{
                    label: 'Category',
                    error: !!errors.categoryAutocomplete,
                    helperText: errors.categoryAutocomplete?.message,
                    required: true,
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12, md: 6}}>
            <Controller
              control={control}
              name="paymentMethodAutocomplete"
              defaultValue={null}
              rules={{required: 'Payment-Method is required'}}
              render={({field: {onChange, value}}) => (
                <PaymentMethodAutocomplete
                  onChange={(_, value) => onChange(value)}
                  value={value}
                  textFieldProps={{
                    label: 'Payment Method',
                    error: !!errors.paymentMethodAutocomplete,
                    helperText: errors.paymentMethodAutocomplete?.message,
                    required: true,
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <Controller
              control={control}
              name="receiverAutocomplete"
              defaultValue={null}
              rules={{required: 'Receiver is required'}}
              render={({field: {onChange, value}}) => (
                <ReceiverAutocomplete
                  onChange={(_, value) => onChange(value)}
                  value={value}
                  textFieldProps={{
                    label: 'Receiver',
                    error: !!errors.receiverAutocomplete,
                    helperText: errors.receiverAutocomplete?.message,
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
          {/* <Grid container size={{xs: 12}} columns={10} spacing={AppConfig.baseSpacing}>
            <Grid size={{xs: 2}}>
              <FileUpload sx={{width: '100%'}} onFileUpload={handler.onFileUpload} multiple />
            </Grid>

            {filePreview.map(file => (
              <Grid size={{xs: 2}} key={file.name.replaceAll(' ', '_').toLowerCase()}>
                <FileUploadPreview
                  fileName={file.name}
                  fileSize={file.size}
                  mimeType={file.type}
                  buffer={file.buffer as string}
                  onDelete={f => setUploadedFiles(prev => prev.filter(pf => pf.name !== f.fileName))}
                />
              </Grid>
            ))}

            {defaultValues &&
              defaultValues.attachments &&
              defaultValues.attachments
                .filter(fileName => fileName)
                .map(fileName => (
                  <Grid size={{xs: 2}} key={fileName!.replaceAll(' ', '_').toLowerCase()}>
                    <FilePreview
                      fileName={fileName!}
                      fileUrl={pb.files.getUrl(defaultValues, fileName!, {token: fileToken})}
                      sx={markedForDeletion.includes(fileName!) ? {opacity: 0.5} : {}}
                      onDelete={({fileName}) => setMarkedForDeletion(prev => [...prev, fileName])}
                    />
                  </Grid>
                ))}
          </Grid> */}
        </Grid>
      )}
    </EntityDrawer>
  );
};
