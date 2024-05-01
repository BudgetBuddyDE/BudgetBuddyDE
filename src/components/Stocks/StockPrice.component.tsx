import React from 'react';

import {LabelBadge, type TLabelBadgeProps} from '@/components/Base';
import {Formatter} from '@/services';

export type TStockPriceProps = {
  price: number;
  trend?: 'up' | 'down';
  currency?: string;
} & Pick<TLabelBadgeProps, 'boxProps'>;

export const StockPrice: React.FC<TStockPriceProps> = ({price, trend, currency = 'EUR', boxProps}) => {
  return (
    <LabelBadge color={trend ? (trend === 'up' ? 'success' : 'error') : 'primary'} {...boxProps}>
      {Formatter.formatBalance(price, currency)}
    </LabelBadge>
  );
};
