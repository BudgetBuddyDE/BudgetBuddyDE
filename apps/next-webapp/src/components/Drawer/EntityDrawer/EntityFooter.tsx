import { Stack, Button, CircularProgress } from '@mui/material';
import React from 'react';

export type EntityFooterProps = {
  onClose: () => void;
  isLoading?: boolean;
};

export const EntityFooter = React.forwardRef<HTMLButtonElement, EntityFooterProps>(
  ({ isLoading, onClose }, ref) => {
    return (
      <Stack direction={'row'} justifyContent={'flex-end'} sx={{ mt: 'auto', p: 2, pt: 0 }}>
        <Button sx={{ mr: 2 }} onClick={onClose}>
          Close
        </Button>
        <Button
          ref={ref}
          type="submit"
          variant="contained"
          startIcon={isLoading ? <CircularProgress color="inherit" size={16} /> : undefined}
          tabIndex={1}
        >
          Save
        </Button>
      </Stack>
    );
  }
);
