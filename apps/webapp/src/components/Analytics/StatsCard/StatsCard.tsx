'use client';

import {
  AddRounded,
  BalanceRounded,
  QuestionMarkRounded,
  ReceiptLongRounded,
  RemoveRounded,
  RequestQuoteRounded,
  SavingsRounded,
  TrendingDownRounded,
  TrendingUpRounded,
} from '@mui/icons-material';
import {Skeleton, type SxProps, type Theme, Typography} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {CurrencyFormatter} from '@/utils/Formatter/CurrencyFormatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';

export type TStatsCardProps = {
  label: string | number;
  value: string | number;
  valueInformation?: string;
  icon?: 'add' | 'balance' | 'receipt' | 'remove' | 'requestQuote' | 'savings' | 'trendingDown' | 'trendingUp';
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

const ICONS = {
  add: AddRounded,
  balance: BalanceRounded,
  receipt: ReceiptLongRounded,
  remove: RemoveRounded,
  requestQuote: RequestQuoteRounded,
  savings: SavingsRounded,
  trendingDown: TrendingDownRounded,
  trendingUp: TrendingUpRounded,
} as const;

export const StatsCard: React.FC<TStatsCardProps> = ({label, value, valueInformation, icon, isLoading = false}) => {
  const currency = useCurrencyPreference();
  const IconComponent = icon ? ICONS[icon] : QuestionMarkRounded;
  const formatCurrency = (text: string | number) =>
    typeof text === 'string'
      ? text.replace(/(?:€|\$)\s?(-?[\d,.]+)/g, (_match, amount: string) =>
          CurrencyFormatter.formatBalance(Number(amount.replace(/,/g, '')), currency),
        )
      : text;

  return (
    <Card sx={{position: 'relative', height: '100%', px: 2, py: 1.25}}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 'bold',
        }}
      >
        {label}
      </Typography>
      {
        <Typography
          variant="h5"
          noWrap
          sx={{
            fontWeight: 'bold',
          }}
        >
          {isLoading ? <Skeleton width={150} /> : formatCurrency(value)}
        </Typography>
      }
      {valueInformation && (
        <Typography variant="caption">
          {isLoading ? <Skeleton width={100} height={'1.6rem'} /> : formatCurrency(valueInformation)}
        </Typography>
      )}

      <IconComponent sx={StatsIconStyle} />
    </Card>
  );
};
