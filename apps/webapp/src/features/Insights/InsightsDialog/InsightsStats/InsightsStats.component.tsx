import {Divider, List, ListItem, ListItemText, Stack, Tooltip, Typography} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {Formatter} from '@/services/Formatter';

export type TInsightsCategoryStats = {
  name: string;
  total: number;
  average: number;
};

export type TInsightsStatsProps = {
  stats: TInsightsCategoryStats[];
};

export const InsightsStats: React.FC<TInsightsStatsProps> = ({stats}) => {
  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{px: 2, pt: 2}}>
        <Card.Title>Stats</Card.Title>
      </Card.Header>
      <Card.Body>
        <List dense>
          {stats.length > 1 && (
            <React.Fragment>
              <ListItem
                secondaryAction={
                  <Stack textAlign={'right'}>
                    <Tooltip placement={'left'} title={'Average'}>
                      <Typography variant="caption">
                        {Formatter.formatBalance(stats.reduce((acc, curr) => acc + curr.average, 0))}
                      </Typography>
                    </Tooltip>
                    <Tooltip placement={'left'} title={'Total'}>
                      <Typography variant="caption">
                        {Formatter.formatBalance(stats.reduce((acc, curr) => acc + curr.total, 0))}
                      </Typography>
                    </Tooltip>
                  </Stack>
                }>
                <ListItemText primary={'Combined'} />
              </ListItem>
              <Divider />
            </React.Fragment>
          )}
          {stats.map(({name, total, average}, idx, arr) => (
            <React.Fragment key={name.toLowerCase()}>
              <ListItem
                secondaryAction={
                  <Stack textAlign={'right'}>
                    <Tooltip placement={'left'} title={'Average'}>
                      <Typography variant="caption">{Formatter.formatBalance(average)}</Typography>
                    </Tooltip>
                    <Tooltip placement={'left'} title={'Total'}>
                      <Typography variant="caption">{Formatter.formatBalance(total)}</Typography>
                    </Tooltip>
                  </Stack>
                }>
                <ListItemText primary={name} />
              </ListItem>
              {idx !== arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Card.Body>
    </Card>
  );
};
