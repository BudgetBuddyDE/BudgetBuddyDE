'use client';

import { Image } from '@/components/Image';
import { ActionPaper } from '@/components/ActionPaper';
import { Card } from '@/components/Card';
import { type TRelatedAsset } from '@/types';
import { Chip, Stack, Typography, useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Formatter } from '@/utils/Formatter';
import { areaElementClasses, SparkLineChart } from '@mui/x-charts';

export type RelatedAssetProps = { asset: TRelatedAsset };

export const RelatedAsset: React.FC<RelatedAssetProps> = ({ asset }) => {
  const router = useRouter();
  const theme = useTheme();
  const handleClick = React.useCallback(() => {
    router.push('/stocks/' + asset.identifier);
  }, [asset]);
  const quotes = React.useMemo(() => {
    return asset.quotes ?? [];
  }, [asset]);
  const stats = React.useMemo(() => {
    const DEFAULT_CURRENCY = 'EUR';
    const DEFAULT_DATE = new Date();
    const firstQuote = quotes[0] || {
      currency: DEFAULT_CURRENCY,
      price: 0,
      date: DEFAULT_DATE,
      identifier: asset.identifier,
    };
    const latestQuote = quotes[quotes.length - 1] || {
      currency: DEFAULT_CURRENCY,
      price: 0,
      date: DEFAULT_DATE,
      identifier: asset.identifier,
    };
    return {
      firstQuote,
      latestQuote,
      hasPriceIncreased: latestQuote.price > firstQuote.price,
    };
  }, [quotes]);
  return (
    <Card
      onClick={handleClick}
      sx={{
        p: 0,
        ':hover': {
          cursor: 'pointer',
        },
      }}
    >
      <Card.Header>
        <Stack flexDirection={'row'} alignItems={'center'} columnGap={2} sx={{ m: 2, mb: 1.5 }}>
          <ActionPaper
            sx={{
              minWidth: '40px',
              height: '40px',
            }}
          >
            <Image src={asset.logoUrl} sx={{ width: 'inherit', height: 'inherit' }} />
          </ActionPaper>
          <Typography variant="subtitle1" noWrap>
            {asset.securityName}
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            color={stats.hasPriceIncreased ? 'success' : 'error'}
            label={Formatter.currency.formatBalance(
              stats.latestQuote.price,
              stats.latestQuote.currency
            )}
            sx={{ ml: 'auto' }}
          />
        </Stack>
      </Card.Header>
      <Card.Body>
        <SparkLineChart
          color={theme.palette[stats.hasPriceIncreased ? 'success' : 'error'].main}
          data={quotes.map(({ price }) => price)}
          curve="natural"
          margin={{ top: 5, right: -5, bottom: 5, left: -5 }}
          showHighlight
          valueFormatter={(value) => Formatter.currency.formatBalance(value ?? 0)}
          height={50}
          showTooltip
          xAxis={{
            scaleType: 'band',
            data: quotes.map(({ date }) => Formatter.date.format(date, true)),
          }}
          sx={{
            [`& .${areaElementClasses.root}`]: {
              fill: `url(#area-gradient-${asset.identifier})`,
            },
          }}
        />
      </Card.Body>
    </Card>
  );
};
