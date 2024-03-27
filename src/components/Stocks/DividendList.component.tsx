import React from 'react';
import { Box, Divider, List, ListItem, ListItemText } from '@mui/material';
import { format } from 'date-fns';
import { EventBusyRounded } from '@mui/icons-material';
import { type TDividendDetails } from './types';
import { Card, NoResults } from '../Base';
import { StockService } from './Stock.service';
import { StockPrice } from './StockPrice.component';

export type TDividendListProps = {
  dividends: TDividendDetails[];
};

export const DividendList: React.FC<TDividendListProps> = ({ dividends }) => {
  const futureDividends = React.useMemo(() => {
    return StockService.transformDividendDetails(dividends);
  }, [dividends]);

  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ p: 2, pb: 0 }}>
        <Box>
          <Card.Title>Dividends</Card.Title>
        </Box>
      </Card.Header>
      <Card.Body>
        {futureDividends.length > 0 ? (
          <List>
            {futureDividends.map((dividend, idx, arr) => (
              <React.Fragment key={dividend.key}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Box>
                      <StockPrice
                        price={dividend.dividend.price}
                        currency={dividend.dividend.currency}
                      />
                    </Box>
                  }
                >
                  <ListItemText
                    primary={format(dividend.dividend.paymentDate, 'dd.MM')}
                    secondary={
                      <React.Fragment>
                        Ex-Date: {format(dividend.dividend.exDate, 'dd.MM')}
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {idx + 1 !== arr.length && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <NoResults
            icon={<EventBusyRounded />}
            text="No upcoming dividends found."
            sx={{ m: 2 }}
          />
        )}
      </Card.Body>
    </Card>
  );
};
