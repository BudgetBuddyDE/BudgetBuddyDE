import { Card } from '@/components/Card';
import { NoResults } from '@/components/NoResults';
import { type TAsset } from '@/types';
import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import React from 'react';

export type ScoringsProps = {
  scorings: TAsset['analysis']['scorings'];
};

export const Scorings: React.FC<ScoringsProps> = ({ scorings }) => {
  const hasScorings = scorings.length > 0;
  const labelMapping: Record<'dividend' | 'high_growth_investing' | 'levermann', string> = {
    dividend: 'Dividend',
    high_growth_investing: 'HGI',
    levermann: 'Levermann',
  };
  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ px: 2, pt: 2, mb: 0 }}>
        <Box>
          <Card.Title>Scorings</Card.Title>
          <Card.Subtitle>Rating based on scoring models</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{ p: hasScorings ? 0 : 2 }}>
        {!hasScorings && <NoResults text={'No scorings available'} />}

        {hasScorings && (
          <List dense disablePadding sx={{ py: 0 }}>
            {scorings.map((scoring, idx, arr) => (
              <React.Fragment key={scoring.type}>
                <ListItem
                  secondaryAction={
                    <Typography>
                      {scoring.value} / {scoring.maxValue}
                    </Typography>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography>
                        {labelMapping[scoring.type as keyof typeof labelMapping]}-strategy
                      </Typography>
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
