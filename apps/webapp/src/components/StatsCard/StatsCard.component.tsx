import {QuestionMarkRounded} from '@mui/icons-material';
import {Skeleton, type SxProps, type Theme, Typography} from '@mui/material';
import React from 'react';

import {Card} from '../Base/Card';

export type TStatsCardProps = {
  label: string | number;
  value: string | number;
  valueInformation?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
};

export const StatsIconStyle: SxProps<Theme> = {
  zIndex: 1,
  position: 'absolute',
  bottom: '.1rem',
  right: '.5rem',
  fontSize: '420%',
  opacity: 0.25,
  color: theme => theme.palette.primary.main,
};

export const StatsCard: React.FC<TStatsCardProps> = ({label, value, valueInformation, icon, isLoading = false}) => {
  return (
    <Card sx={{position: 'relative', height: '100%', px: 2, py: 1.25}}>
      <Typography variant="body2" fontWeight={'bold'}>
        {label}
      </Typography>
      {
        <Typography variant="h5" fontWeight={'bold'} noWrap>
          {isLoading ? <Skeleton width={150} /> : value}
        </Typography>
      }
      {valueInformation && (
        <Typography variant="caption">
          {isLoading ? <Skeleton width={100} height={'1.6rem'} /> : valueInformation}
        </Typography>
      )}

      {icon ? (
        React.isValidElement(icon) &&
        React.cloneElement(icon, {
          ...icon.props,
          sx: {
            ...StatsIconStyle,
            ...icon.props.sx,
          },
        })
      ) : (
        <QuestionMarkRounded sx={StatsIconStyle} />
      )}
    </Card>
  );
};
