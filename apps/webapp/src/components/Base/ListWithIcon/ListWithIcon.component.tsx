import {Box, Chip, Typography} from '@mui/material';
import React from 'react';

import {Icon} from '@/components/Icon/Icon.component';
import {formatBalance} from '@/utils';

import {ActionPaper} from '../ActionPaper/ActionPaper.component';
import {Image} from '../Image/Image.component';

export type TListWithIconProps = {
  icon?: JSX.Element;
  imageUrl?: string;
  title: string;
  subtitle?: string | string[] | JSX.Element;
  amount?: string | number | React.ReactNode;
  onClick?: () => void;
};

export const ListWithIcon: React.FC<TListWithIconProps> = ({icon, imageUrl, title, subtitle, amount, onClick}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        mt: 1,
        borderRadius: theme => theme.shape.borderRadius + 'px',
        ':hover': onClick && {
          backgroundColor: theme => theme.palette.action.hover,
          cursor: 'Pointer',
        },
      }}
      onClick={onClick}>
      {imageUrl ? (
        <ActionPaper
          sx={{
            minWidth: '40px',
            width: '40px',
            height: '40px',
            mr: 1,
          }}>
          <Image src={imageUrl} sx={{width: 'inherit', height: 'inherit'}} />
        </ActionPaper>
      ) : (
        <Icon icon={icon} sx={{mr: 1}} />
      )}
      <Box>
        <Typography fontWeight="bold">{title}</Typography>
        {typeof subtitle === 'string' && <Typography>{subtitle}</Typography>}
        {subtitle &&
          Array.isArray(subtitle) &&
          typeof subtitle[0] === 'string' &&
          subtitle.map(label => (
            <Chip
              key={label.toLowerCase().replace(' ', '_')}
              label={label}
              sx={{mr: 1}}
              variant="outlined"
              size="small"
            />
          ))}
        {subtitle && typeof subtitle === 'object' && subtitle}
      </Box>
      {amount && (
        <Box sx={{ml: 'auto'}}>
          <Typography fontWeight="bold">
            {typeof amount === 'string'
              ? amount
              : typeof amount === 'object'
                ? amount
                : formatBalance(amount as number)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
