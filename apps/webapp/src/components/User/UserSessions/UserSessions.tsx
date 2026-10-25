import {Stack} from '@mui/material';
import {headers} from 'next/headers';
import {getTranslations} from 'next-intl/server';
import {authClient} from '@/authClient';
import {Card} from '@/components/Card';
import {RevokeSessionsButton} from './RevokeSessionsBtn';
import {SessionList} from './SessionList';

export const UserSessions = async () => {
  const t = await getTranslations('UserSessions');
  const {data, error} = await authClient.listSessions({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (error) throw error;
  return (
    <Card sx={{px: 0}}>
      <Card.Header sx={{px: 2}}>
        <Stack>
          <Card.Title>{t('title')}</Card.Title>
          <Card.Subtitle>{t('description')}</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        <SessionList sessions={data} />
      </Card.Body>
      <Card.Footer sx={{px: 2, display: 'flex', justifyContent: 'flex-end'}}>
        <RevokeSessionsButton />
      </Card.Footer>
    </Card>
  );
};
