import {type TDividend} from '@budgetbuddyde/types';
import {EventBusyRounded} from '@mui/icons-material';
import {Box, Divider, List, ListItem, ListItemText} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {NoResults} from '@/components/NoResults';

import {StockPrice} from '../../StockPrice';

export type TDividendListProps = {
  dividends: TDividend[];
};

export const DividendList: React.FC<TDividendListProps> = ({dividends}) => {
  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{p: 2, pb: 0}}>
        <Box>
          <Card.Title>Dividends</Card.Title>
        </Box>
      </Card.Header>
      <Card.Body>
        {dividends.length > 0 ? (
          <List>
            {dividends.map((dividend, idx, arr) => (
              <React.Fragment key={dividend.exDate.toString()}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Box>
                      <StockPrice price={dividend.price} currency={dividend.currency} />
                    </Box>
                  }>
                  <ListItemText
                    primary={format(dividend.paymentDate, 'dd.MM')}
                    secondary={<React.Fragment>Ex-Date: {format(dividend.exDate, 'dd.MM')}</React.Fragment>}
                  />
                </ListItem>
                {idx + 1 !== arr.length && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <NoResults icon={<EventBusyRounded />} text="No dividend information found." sx={{m: 2}} />
        )}
      </Card.Body>
    </Card>
  );
};
