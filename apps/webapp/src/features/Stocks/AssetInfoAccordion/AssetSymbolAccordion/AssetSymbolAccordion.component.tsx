import {ExpandMoreRounded} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import React from 'react';

import {NoResults} from '@/components/NoResults';

export type TAssetSymbolAccordionProps = {
  symbols: {symbol: string; exchange: string}[];
};

export const AssetSymbolAccordion: React.FC<TAssetSymbolAccordionProps> = ({symbols}) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography variant="subtitle1" fontWeight={'bold'}>
          Symbols
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{px: 0}}>
        {symbols.length > 0 ? (
          <List sx={{py: 0}} disablePadding>
            {symbols.map(({symbol, exchange}, idx, arr) => (
              <React.Fragment key={symbol}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={<Typography variant="body2">{symbol}</Typography>}
                  dense>
                  <ListItemText primary={exchange} />
                </ListItem>
                {idx + 1 !== arr.length && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <NoResults text="No symbols found for this asset" sx={{m: 2, mt: 0}} />
        )}
      </AccordionDetails>
    </Accordion>
  );
};
