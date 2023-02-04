import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Box, SxProps, Theme, Tooltip, Typography } from '@mui/material';
import { FC } from 'react';
import { Card } from '../components';

export interface IStatsProps {
  title: string;
  subtitle: string;
  info?: string;
  icon?: JSX.Element;
}

export const StatsIconStyle: SxProps<Theme> = {
  zIndex: 1,
  position: 'absolute',
  bottom: '-1rem',
  left: '.5rem',
  fontSize: '5.5rem',
  opacity: 0.25,
  color: (theme) => theme.palette.primary.main,
};

export const Stats: FC<IStatsProps> = ({
  title,
  subtitle,
  info = '',
  icon = <AccountBalanceWalletIcon sx={StatsIconStyle} />,
}) => {
  return (
    <Card sx={{ position: 'relative', textAlign: 'right', overflow: 'hidden' }}>
      {icon}
      <Typography variant="h4">{title}</Typography>
      <Tooltip title={info}>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="flex-end"
          alignItems="center"
          flexShrink={1}
        >
          <Typography variant="h6" sx={{ whiteSpace: { xs: 'wrap', md: 'nowrap' } }}>
            {subtitle}
          </Typography>
          {info && <InfoIcon sx={{ ml: '.25rem', fontSize: '.9rem' }} />}
        </Box>
      </Tooltip>
    </Card>
  );
};
