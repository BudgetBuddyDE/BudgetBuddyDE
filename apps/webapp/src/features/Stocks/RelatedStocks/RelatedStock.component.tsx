import {type TRelatedStockWithQuotes} from '@budgetbuddyde/types';
import {Chip, Skeleton, Stack, Typography, useTheme} from '@mui/material';
import {areaElementClasses} from '@mui/x-charts/LineChart';
import {SparkLineChart} from '@mui/x-charts/SparkLineChart';
import {format} from 'date-fns';
import React from 'react';
import {useNavigate} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {ActionPaper} from '@/components/Base/ActionPaper';
import {Card} from '@/components/Base/Card';
import {Image} from '@/components/Base/Image';
import {Formatter} from '@/services/Formatter';

export type TRelatedStockProps = {
  isLoading?: boolean;
  stock?: TRelatedStockWithQuotes;
};

export const RelatedStock: React.FC<TRelatedStockProps> = ({isLoading = false, stock}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  if (isLoading || !stock) {
    return (
      <Card sx={{p: 0}}>
        <Card.Header sx={{p: 1.5, justifyContent: 'unset'}}>
          <Skeleton variant="rounded" width={32} height={32} />
          <Skeleton variant="text" width={'60%'} sx={{ml: 1}} />
        </Card.Header>
        <Card.Body>
          <Skeleton
            variant="rectangular"
            height={50}
            sx={{
              borderBottomLeftRadius: theme => theme.shape.borderRadius + 'px',
              borderBottomRightRadius: theme => theme.shape.borderRadius + 'px',
            }}
          />
        </Card.Body>
      </Card>
    );
  }

  const firstQuote = React.useMemo(() => {
    return stock.quotes[0];
  }, [stock]);

  const latestQuote = React.useMemo(() => {
    return stock.quotes[stock.quotes.length - 1];
  }, [stock]);

  return (
    <React.Fragment>
      <Card
        onClick={() => navigate('/stocks/' + stock.asset._id.identifier)}
        sx={{
          p: 0,
          ':hover': {
            cursor: 'pointer',
          },
        }}>
        <Stack flexDirection={'row'} alignItems={'center'} columnGap={AppConfig.baseSpacing / 2} sx={{m: 2, mb: 1.5}}>
          <ActionPaper
            sx={{
              minWidth: '32px',
              width: '32px',
              height: '32px',
            }}>
            <Image src={stock.asset.logo} sx={{width: 'inherit', height: 'inherit'}} />
          </ActionPaper>
          <Typography variant="subtitle1" noWrap>
            {stock.asset.name}
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            color={latestQuote.price > firstQuote.price ? 'success' : 'error'}
            label={Formatter.formatBalance(latestQuote.price, latestQuote.currency)}
            sx={{ml: 'auto'}}
          />
        </Stack>

        <SparkLineChart
          colors={[theme.palette[latestQuote.price > firstQuote.price ? 'success' : 'error'].main]}
          data={stock.quotes.map(({price}) => price)}
          curve="natural"
          margin={{top: 5, right: -5, bottom: 5, left: -5}}
          showHighlight
          valueFormatter={value => Formatter.formatBalance(value ?? 0)}
          height={50}
          showTooltip
          xAxis={{
            scaleType: 'band',
            data: stock.quotes.map(({date}) => format(date, 'dd.MM')),
          }}
          sx={{
            [`& .${areaElementClasses.root}`]: {
              fill: `url(#area-gradient-${stock.asset.name})`,
            },
          }}
        />
      </Card>
    </React.Fragment>
  );
};
