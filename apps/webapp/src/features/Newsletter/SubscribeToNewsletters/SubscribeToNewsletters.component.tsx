import {type TNewsletter} from '@budgetbuddyde/types';
import {Box, List, ListItem, ListItemText, Switch} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {CircularProgress} from '@/components/Loading';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';

import {NewsletterService} from '../Newsletter.service';

export const SubscribeToNewsletters = () => {
  const {session: session} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const [loading, _setLoading] = React.useState(true);
  const [newsletters, _setNewsletters] = React.useState<TNewsletter[]>([]);
  const [subscribedNewsletters, setSubscribedNewsletters] = React.useState<TNewsletter['id'][]>([]);

  const retrieveNewsletterSubscriptions = async () => {
    // TODO: Re-enable newsletter subscriptions
    // setLoading(true);
    // const [availableNewsletters, error] = await NewsletterService.getNewsletters(true);
    // if (error) logger.error('Fetching of newsletter-options failed', error);
    // if (!availableNewsletters) return setLoading(false);
    // setNewsletters(availableNewsletters);
    // if (!session) return setLoading(false);
    // const [subscribedNewsletters, err] = await NewsletterService.getSubscribedNewsletters(
    //   session.id,
    //   availableNewsletters,
    // );
    // if (err) logger.error('Failed to subscribe to newsletter', error);
    // if (!subscribedNewsletters) return setLoading(false);
    // setSubscribedNewsletters(subscribedNewsletters.map(({id}) => id));
    // setLoading(false);
  };

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    if (!session) throw new Error('Missing session user.');
    const newsletterId = event.target.value;

    if (checked) {
      // Trigger opt-in
      const [success, error] = await NewsletterService.subscribeToNewsletter({userId: session.user.id, newsletterId});
      if (error) {
        showSnackbar({message: error.message});
        return;
      }
      showSnackbar({
        message: success
          ? 'Look into your inbox in order to verify your subscription.'
          : 'Failed to subscribe to newsletter.',
      });
    } else {
      const [success, error] = await NewsletterService.unsubscribeToNewsletter({userId: session.user.id, newsletterId});
      if (error) {
        showSnackbar({message: error.message});
        return;
      }
      showSnackbar({
        message: success ? 'Successfully unsubscribed from newsletter.' : 'Failed to unsubscribe from newsletter.',
      });
      setSubscribedNewsletters(subscribedNewsletters.filter(id => id !== newsletterId));
    }
  };

  React.useEffect(() => {
    retrieveNewsletterSubscriptions();
  }, []);

  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{p: 2, pb: 0}}>
        <Box>
          <Card.Title>Newsletters</Card.Title>
          <Card.Subtitle>Manage your newsletter subscriptions</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        {!loading ? (
          <List dense>
            {newsletters.map(({id, name}) => (
              <ListItem key={id}>
                <ListItemText primary={name} />
                <Switch edge="end" value={id} onChange={handleToggle} checked={subscribedNewsletters.includes(id)} />
              </ListItem>
            ))}
          </List>
        ) : (
          <CircularProgress />
        )}
      </Card.Body>
    </Card>
  );
};
