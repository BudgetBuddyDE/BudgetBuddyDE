import {Box, Dialog, DialogContent, DialogProps, Slide, Typography, alpha} from '@mui/material';
import {type TransitionProps} from '@mui/material/transitions';
import React from 'react';

import {Image} from '../Base/Image';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export type TImageViewDialogProps = {
  dialogProps?: DialogProps;
  withTransition?: boolean;
  fileName: string;
  fileUrl: string;
};

export const ImageViewDialog: React.FC<TImageViewDialogProps> = ({
  dialogProps,
  fileName,
  fileUrl,
  withTransition = false,
}) => {
  return (
    <Dialog
      {...dialogProps}
      open={dialogProps ? dialogProps.open : false}
      TransitionComponent={
        withTransition
          ? dialogProps && dialogProps.TransitionComponent
            ? dialogProps.TransitionComponent
            : Transition
          : undefined
      }
      keepMounted
      maxWidth={'md'}
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          aspectRatio: {xs: '1 / .9', md: '1/1'},
          backgroundColor: 'transparent',
          border: 'none',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: alpha('#000', 0.7),
          },
        },
      }}>
      <DialogContent sx={{p: 1}}>
        {fileUrl && fileName && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}>
            <Image
              src={fileUrl}
              alt={fileName}
              sx={{
                width: '100%',
                maxHeight: {xs: '85%', md: '90%'},
                display: 'flex',
                flex: 1,
                objectFit: 'contain',
                mx: 'auto',
              }}
            />

            <Typography
              sx={{
                mx: 'auto',
                mt: 1,
                px: 1.5,
                py: 1,
                backgroundColor: alpha('#000', 0.3),
                borderRadius: theme => theme.shape.borderRadius + 'px',
                width: 'fit-content',
              }}>
              {fileName}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
