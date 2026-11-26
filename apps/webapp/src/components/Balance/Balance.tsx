'use client';

import {Typography} from '@mui/material';
import type React from 'react';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference, useLocalePreference} from '@/utils/Formatter/PreferenceContext';

export type BalanceProps = {
  amount: number;
  currency?: 'EUR' | 'USD';
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  component?: React.ElementType;
  sx?: React.ComponentProps<typeof Typography>['sx'];
};

export const Balance: React.FC<BalanceProps> = ({
  amount,
  currency: currencyProp,
  locale: localeProp,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  component = 'span',
  sx,
}) => {
  const preferredCurrency = useCurrencyPreference();
  const preferredLocale = useLocalePreference();

  return (
    <Typography component={component} variant="inherit" sx={{fontVariantNumeric: 'tabular-nums', ...sx}}>
      {Formatter.currency.formatBalance(
        amount,
        currencyProp ?? preferredCurrency,
        minimumFractionDigits,
        maximumFractionDigits,
        localeProp ?? preferredLocale,
      )}
    </Typography>
  );
};
