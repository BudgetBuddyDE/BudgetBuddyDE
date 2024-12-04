import {NewspaperRounded} from '@mui/icons-material';
import {Box, Divider, Link, List, ListItem, ListItemButton, ListItemText} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {NoResults} from '@/components/NoResults';

export type TStockNewsProps = {
  news: {
    heading: string;
    summary: string;
    link: string;
  }[];
};

export const StockNews: React.FC<TStockNewsProps> = ({news}) => {
  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{p: 2, pb: 0}}>
        <Box>
          <Card.Title>News</Card.Title>
          <Card.Subtitle>What is currently trending?</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        {news.length > 0 ? (
          <List>
            {news.map((article, idx, arr) => (
              // FIXME: Don't use idx as key
              <React.Fragment key={idx}>
                <ListItem alignItems="flex-start" disablePadding>
                  <ListItemButton LinkComponent={Link} href={article.link} target="_blank">
                    <ListItemText
                      primary={article.heading}
                      secondary={<React.Fragment>{article.summary}</React.Fragment>}
                    />
                  </ListItemButton>
                </ListItem>
                {idx + 1 !== arr.length && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <NoResults icon={<NewspaperRounded />} text="There are no news available." sx={{m: 2}} />
        )}
      </Card.Body>
    </Card>
  );
};
