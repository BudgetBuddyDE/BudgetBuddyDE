import {type TAssetWatchlistWithQuote} from '@budgetbuddyde/types';
import {AddRounded, FormatListBulletedRounded} from '@mui/icons-material';
import {Box, Chip, IconButton} from '@mui/material';
import React from 'react';
import {useNavigate} from 'react-router';

import {Card} from '@/components/Base/Card';
import {ListWithIcon} from '@/components/Base/ListWithIcon';
import {NoResults} from '@/components/NoResults';
import {useSnackbarContext} from '@/features/Snackbar';

import {StockPrice} from '../../StockPrice/StockPrice.component';

export type TStockWatchlistProps = {
  title: string;
  subtitle?: string;
  data: TAssetWatchlistWithQuote[];
  onAddItem?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const StockWatchlist: React.FC<TStockWatchlistProps> = ({title, subtitle, data, onAddItem}) => {
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbarContext();
  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>{title}</Card.Title>
          {subtitle && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>

        {onAddItem && (
          <Card.HeaderActions>
            <IconButton size="small" onClick={onAddItem}>
              <AddRounded color="primary" />
            </IconButton>
          </Card.HeaderActions>
        )}
      </Card.Header>
      <Card.Body>
        {data.length > 0 ? (
          data.map(asset => (
            <ListWithIcon
              key={asset.id}
              title={asset.name}
              subtitle={
                <Box sx={{display: 'flex', flexDirection: 'row'}}>
                  <Chip variant="outlined" size="small" sx={{mr: 1}} label={asset.expand.exchange.symbol} />
                  <Chip
                    variant="outlined"
                    size="small"
                    sx={{mr: 1}}
                    label={asset.isin}
                    onClick={async event => {
                      event.stopPropagation();
                      await navigator.clipboard.writeText(asset.isin);
                      showSnackbar({message: 'Copied to clipboard'});
                    }}
                  />
                </Box>
              }
              amount={<StockPrice price={asset.quote.price} />}
              imageUrl={asset.logo}
              onClick={() => navigate('/stocks/' + asset.isin)}
            />
          ))
        ) : (
          <NoResults icon={<FormatListBulletedRounded />} text="You haven't watched any assets" sx={{mt: 2}} />
        )}
      </Card.Body>
    </Card>
  );
};
