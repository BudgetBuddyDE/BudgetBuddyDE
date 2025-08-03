import { Box, Chip, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';

import { Card } from '@/components/Card';
import { Formatter } from '@/utils/Formatter';

export const MetalQuoteList = () => {
  // FIXME: Replace with actual data fetching logic
  const quotes: any[] = [];
  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ p: 2, pb: 0 }}>
        <Box>
          <Card.Title>Metals</Card.Title>
          <Card.Subtitle>Todays metal quotes</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{ px: 0 }}>
        <List dense>
          {(quotes ?? []).map((quote) => (
            <ListItem
              key={quote.code}
              secondaryAction={
                <Stack>
                  {Object.entries(quote.quote).map(([currency, price]) => (
                    <Typography
                      variant="subtitle2"
                      key={quote.code + '-' + currency}
                      style={{ textAlign: 'right' }}
                    >
                      {Formatter.currency.formatBalance(0, currency)}
                    </Typography>
                  ))}
                </Stack>
              }
            >
              <ListItemText
                primary={<Typography fontWeight="bold">{quote.name}</Typography>}
                secondary={
                  <Stack flexDirection={'row'}>
                    <Chip size="small" variant="outlined" label={quote.code} sx={{ mr: 1 }} />
                    <Chip size="small" variant="outlined" label={'Troy Ounce'} />
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      </Card.Body>
    </Card>
  );
};
