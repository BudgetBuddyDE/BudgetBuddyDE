import { Card } from '@/components/Card';
import { NoResults } from '@/components/NoResults';
import { type TAsset } from '@/types';
import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import React from 'react';

export type RecommendationProps = {
  recommendations: TAsset['analysis']['recommendation'];
};

export const Recommendations: React.FC<RecommendationProps> = ({ recommendations }) => {
  const converted = Object.entries(recommendations).map(([key, value]) => ({
    key,
    value,
  }));
  const hasRecommendations = converted.length > 0;
  const labelMapping: Record<keyof typeof recommendations, string> = {
    strongBuy: 'Strong Buy',
    buy: 'Buy',
    hold: 'Hold',
    sell: 'Sell',
    strongSell: 'Strong Sell',
  };
  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ px: 2, pt: 2, mb: 0 }}>
        <Box>
          <Card.Title>Recommendations</Card.Title>
          <Card.Subtitle>Recommendations based on analysts</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{ p: hasRecommendations ? 0 : 2 }}>
        {!hasRecommendations && <NoResults text={'No recommendations available'} />}

        {hasRecommendations && (
          <List dense disablePadding sx={{ py: 0 }}>
            {converted.map(({ key, value }, idx, arr) => (
              <React.Fragment key={key}>
                <ListItem secondaryAction={<Typography>{value}</Typography>}>
                  <ListItemText
                    primary={
                      <Typography>{labelMapping[key as keyof typeof labelMapping]}</Typography>
                    }
                  />
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
