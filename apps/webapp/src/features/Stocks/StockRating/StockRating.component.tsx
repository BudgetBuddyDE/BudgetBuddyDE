import {type TAssetDetails} from '@budgetbuddyde/types';
import {StarRounded} from '@mui/icons-material';
import {Divider, List, ListItem, ListItemText, useTheme} from '@mui/material';
import {Gauge, gaugeClasses} from '@mui/x-charts';
import React from 'react';

import {NoResults} from '@/components/NoResults';

export type TStockRatingProps = {
  ratings: TAssetDetails['details']['scorings'];
};

export const StockRating: React.FC<TStockRatingProps> = ({ratings}) => {
  const theme = useTheme();
  if (ratings.length === 0) {
    return <NoResults icon={<StarRounded />} text="There are no public ratings available." sx={{m: 2}} />;
  }
  return (
    <List>
      {ratings.map((rating, idx, arr) => (
        <React.Fragment key={rating.source}>
          <ListItem sx={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <ListItemText primary={rating.source} secondary={rating.type} sx={{alignSelf: 'flex-start'}} />
            <Gauge
              value={rating.value}
              valueMax={rating.maxValue}
              cornerRadius={theme.shape.borderRadius}
              startAngle={-110}
              width={200}
              height={100}
              endAngle={110}
              sx={{
                [`& .${gaugeClasses.valueText}`]: {
                  fontSize: theme.typography.h5.fontSize,
                  transform: 'translate(0px, -5px)',
                },
              }}
              text={({value, valueMax}) => `${value} / ${valueMax}`}
            />
          </ListItem>
          {idx + 1 !== arr.length && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};
