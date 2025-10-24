import React from 'react';
import { Card } from '@/components/Card';
import { type TAsset } from '@/types/Stocks/StockPosition';
import { Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import { NoResults } from '@/components/NoResults';
import { CurrencyExchangeRounded } from '@mui/icons-material';

export type SymbolListprops = {
  symbols: TAsset['symbols'];
};

export const SymbolList: React.FC<SymbolListprops> = ({ symbols }) => {
  const hasSymbols = symbols.length > 0;
  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ px: 2, pt: 2, mb: 0 }}>
        <Card.Title>Exchange</Card.Title>
        <Card.Title>Symbol</Card.Title>
      </Card.Header>
      <Card.Body sx={{ p: hasSymbols ? 0 : 2 }}>
        {!hasSymbols && (
          <NoResults icon={<CurrencyExchangeRounded />} text="No symbols found for this asset" />
        )}
        {hasSymbols && (
          <List dense disablePadding sx={{ py: 0 }}>
            {symbols.map(({ exchange, symbol }, idx, arr) => (
              <React.Fragment key={exchange}>
                <ListItem secondaryAction={<Typography>{symbol}</Typography>}>
                  <ListItemText primary={<Typography>{exchange}</Typography>} />
                </ListItem>
                {idx + 1 !== arr.length && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Card.Body>
    </Card>
  );
};
