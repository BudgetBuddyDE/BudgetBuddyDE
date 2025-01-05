import {CloseRounded} from '@mui/icons-material';
import {Button, CircularProgress, IconButton, Stack, Typography} from '@mui/material';
import React from 'react';
import {type DefaultValues, type FieldValues, type UseFormReturn, useForm} from 'react-hook-form';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {useKeyPress} from '@/hooks/useKeyPress';

import {Drawer, type TDrawerProps} from '../Drawer';

export type IEntityDrawer<T extends FieldValues> = Pick<
  TDrawerProps,
  'open' | 'closeOnEscape' | 'closeOnBackdropClick'
> & {
  onClose: () => void;
  onResetForm?: () => T | DefaultValues<T> | undefined;
  title: string;
  subtitle?: string;
  defaultValues?: DefaultValues<T> | undefined;
  children: (props: {form: UseFormReturn<T>}) => React.ReactNode;
  onSubmit: (data: T, onSuccess: () => void) => void;
  isLoading?: boolean;
};

export const EntityDrawer = <T extends FieldValues>({
  open,
  onClose,
  onResetForm,
  title,
  subtitle,
  children,
  defaultValues,
  onSubmit,
  closeOnBackdropClick,
  closeOnEscape,
  isLoading = false,
}: IEntityDrawer<T>) => {
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const saveBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const form = useForm<T>({defaultValues: defaultValues});

  useKeyPress(
    ['s'],
    e => {
      if (saveBtnRef.current) {
        e.preventDefault();
        saveBtnRef.current.click();
      }
    },
    drawerRef.current,
    true,
  );

  const handler = {
    handleClose() {
      onClose();
      handler.handleFormReset();
    },
    handleSubmit(data: T) {
      onSubmit(data, handler.handleFormReset);
    },
    handleFormReset() {
      if (onResetForm) {
        const newValues = onResetForm();
        form.reset(newValues);
      }
    },
  };

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  return (
    <Drawer
      ref={drawerRef}
      open={open}
      onClose={handler.handleClose}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}>
      <React.Fragment>
        <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} sx={{p: 2, pb: 0}}>
          <Stack>
            <Typography variant="subtitle1" fontWeight="bold">
              {title}
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              {subtitle}
            </Typography>
          </Stack>
          <ActionPaper>
            <IconButton color="primary" onClick={handler.handleClose}>
              <CloseRounded />
            </IconButton>
          </ActionPaper>
        </Stack>
        <form
          onSubmit={form.handleSubmit(handler.handleSubmit)}
          style={{display: 'flex', flexDirection: 'column', flex: 1}}
          noValidate>
          {children({form})}

          <Stack direction={'row'} justifyContent={'flex-end'} sx={{mt: 'auto', p: 2, pt: 0}}>
            <Button sx={{mr: 2}} onClick={handler.handleClose}>
              Close
            </Button>
            <Button
              ref={saveBtnRef}
              type="submit"
              variant="contained"
              startIcon={isLoading ? <CircularProgress color="inherit" size={16} /> : undefined}
              tabIndex={1}>
              Save
            </Button>
          </Stack>
        </form>
      </React.Fragment>
    </Drawer>
  );
};
