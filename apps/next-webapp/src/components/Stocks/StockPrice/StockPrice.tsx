import { Formatter } from '@/utils/Formatter';
import { TrendingDown, TrendingUp } from '@mui/icons-material';
import { type BoxProps, Chip, type ChipProps } from '@mui/material';
import React from 'react';

export type TStockPriceProps = {
  price: number;
  trend?: 'up' | 'down';
  currency?: string;
  withIcon?: boolean;
} & BoxProps &
  ChipProps;

export const StockPrice: React.FC<TStockPriceProps> = ({
  price,
  trend,
  withIcon = false,
  currency = 'EUR',
  ...chipProps
}) => {
  return (
    <Chip
      variant="outlined"
      color={trend ? (trend === 'up' ? 'success' : 'error') : 'primary'}
      icon={trend && withIcon ? trend === 'up' ? <TrendingUp /> : <TrendingDown /> : undefined}
      label={Formatter.currency.formatBalance(price, currency)}
      {...chipProps}
    />
  );
};
