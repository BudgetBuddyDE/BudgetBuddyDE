import {TrendingDown, TrendingUp} from '@mui/icons-material';
import {Chip, ChipProps} from '@mui/material';
import React from 'react';

import {type TLabelBadgeProps} from '@/components/Base/LabelBadge';
import {Formatter} from '@/services/Formatter';

export type TStockPriceProps = {
  price: number;
  trend?: 'up' | 'down';
  currency?: string;
  withIcon?: boolean;
} & Pick<TLabelBadgeProps, 'boxProps'> &
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
      label={Formatter.formatBalance(price, currency)}
      {...chipProps}
    />
  );
};
