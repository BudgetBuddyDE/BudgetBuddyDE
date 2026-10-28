import {Button, CircularProgress, Stack} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';

export type EntityFooterProps = {
  onClose: () => void;
  isLoading?: boolean;
};

export const EntityFooter = React.forwardRef<HTMLButtonElement, EntityFooterProps>(({isLoading, onClose}, ref) => {
  const t = useTranslations('EntityDrawer');
  return (
    <Stack
      direction={'row'}
      sx={{
        justifyContent: 'flex-end',
        mt: 'auto',
        p: 2,
        pt: 0,
      }}
    >
      <Button sx={{mr: 2}} onClick={onClose}>
        {t('close')}
      </Button>
      <Button
        ref={ref}
        type="submit"
        variant="contained"
        startIcon={isLoading ? <CircularProgress color="inherit" size={16} /> : undefined}
        tabIndex={0}
      >
        {t('save')}
      </Button>
    </Stack>
  );
});
