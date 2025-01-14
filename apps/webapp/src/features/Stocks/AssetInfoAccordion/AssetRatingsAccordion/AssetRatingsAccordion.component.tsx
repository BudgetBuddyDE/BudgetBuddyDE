import {type TAssetDetails} from '@budgetbuddyde/types';
import {ExpandMoreRounded} from '@mui/icons-material';
import {Accordion, AccordionDetails, AccordionSummary, Typography} from '@mui/material';
import React from 'react';

import {NoResults} from '@/components/NoResults';

import {StockRating} from '../../StockRating';

export type TAssetRatingsAccordionProps = {
  ratings: TAssetDetails['details']['scorings'];
};

export const AssetRatingsAccordion: React.FC<TAssetRatingsAccordionProps> = ({ratings}) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography variant="subtitle1" fontWeight={'bold'}>
          Ratings
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{px: 0}}>
        {ratings.length > 0 ? (
          <StockRating ratings={ratings} />
        ) : (
          <NoResults text="No ratings found for this asset" sx={{m: 2, mt: 0}} />
        )}
      </AccordionDetails>
    </Accordion>
  );
};
