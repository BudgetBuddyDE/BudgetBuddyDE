import {Typography} from '@mui/material';
import React from 'react';

import {ActionPaper, type TActionPaperProps} from '@/components/Base/ActionPaper';

export type TNoDataProps = Omit<TActionPaperProps, 'children'> & {message: string};

export const NoData: React.FC<TNoDataProps> = ({message, ...paperProps}) => {
  return (
    <ActionPaper
      {...paperProps}
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        p: 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...paperProps.sx,
      }}>
      <Typography variant={'h1'} textAlign={'center'}>
        {message}
      </Typography>
    </ActionPaper>
  );
};
