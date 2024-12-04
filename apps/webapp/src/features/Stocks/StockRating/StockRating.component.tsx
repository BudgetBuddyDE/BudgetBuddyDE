import {type TAssetDetails} from '@budgetbuddyde/types';
import {StarRounded} from '@mui/icons-material';
import {Box, Chip, Divider, List, ListItem, ListItemText, Rating, Typography} from '@mui/material';
import React from 'react';

import {NoResults} from '@/components/NoResults';

export type TStockRatingProps = {
  ratings: TAssetDetails['details']['scorings'];
};

export const StockRating: React.FC<TStockRatingProps> = ({ratings}) => {
  if (ratings.length === 0) {
    return <NoResults icon={<StarRounded />} text="There are no public ratings available." sx={{m: 2}} />;
  }
  return (
    <List>
      {ratings.map((article, idx, arr) => (
        <React.Fragment key={idx}>
          <ListItem alignItems="flex-start">
            <ListItemText
              primary={
                <Box>
                  <Typography>{article.source}</Typography>
                  <Chip label={article.type} color="primary" size="small" />
                </Box>
              }
              secondary={<Rating value={article.value} max={article.maxValue} readOnly />}
            />
          </ListItem>
          {idx + 1 !== arr.length && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};
