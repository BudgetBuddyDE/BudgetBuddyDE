import {type TIsin} from '@budgetbuddyde/types';
import {Grid2 as Grid, type Grid2Props as GridProps} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';

import {RelatedStock} from './RelatedStock.component';
import {useFetchRelatedStocks} from './useFetchRelatedStocks.hooks';

export type TRelatedStockWrapperProps = {
  isin: TIsin;
  amount?: number;
  containerProps?: GridProps;
};

export const RelatedStockWrapper: React.FC<TRelatedStockWrapperProps> = ({isin, amount, containerProps}) => {
  const {loading: isLoading, relatedStocks} = useFetchRelatedStocks(isin, amount);
  return (
    <Grid container spacing={AppConfig.baseSpacing} {...containerProps} size={{xs: 12, ...containerProps?.sx}}>
      {isLoading
        ? Array.from({length: 6}).map((_, idx) => (
            <Grid key={idx} size={{xs: 6, md: 4}}>
              <RelatedStock isLoading />
            </Grid>
          ))
        : relatedStocks.map((stock, idx) => (
            <Grid key={idx} size={{xs: 6, md: 4}}>
              <RelatedStock key={stock.asset._id.identifier} stock={stock} />
            </Grid>
          ))}
    </Grid>
  );
};
