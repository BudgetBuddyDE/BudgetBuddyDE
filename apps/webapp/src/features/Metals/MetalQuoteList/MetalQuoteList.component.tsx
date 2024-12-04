import {Box, Chip, List, ListItem, ListItemText, Stack, Typography} from '@mui/material';

import {Card} from '@/components/Base/Card';
import {CircularProgress} from '@/components/Loading';
import {Formatter} from '@/services/Formatter';

import {useMetalQuotes} from '../useMetalQuotes.hook';

export const MetalQuoteList = () => {
  const {isLoading, data: quotes} = useMetalQuotes();
  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{p: 2, pb: 0}}>
        <Box>
          <Card.Title>Metals</Card.Title>
          <Card.Subtitle>Todays metal quotes</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{px: 0}}>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <List dense>
            {(quotes ?? []).map(quote => (
              <ListItem
                key={quote.code}
                secondaryAction={
                  <Stack>
                    {Object.entries(quote.quote).map(([currency, price]) => (
                      <Typography variant="subtitle2" key={quote.code + '-' + currency} style={{textAlign: 'right'}}>
                        {Formatter.formatBalance(price, currency)}
                      </Typography>
                    ))}
                  </Stack>
                }>
                <ListItemText
                  primary={<Typography fontWeight="bold">{quote.name}</Typography>}
                  secondary={
                    <Stack flexDirection={'row'}>
                      <Chip size="small" variant="outlined" label={quote.code} sx={{mr: 1}} />
                      <Chip size="small" variant="outlined" label={'Troy Ounce'} />
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Card.Body>
    </Card>
  );
};
