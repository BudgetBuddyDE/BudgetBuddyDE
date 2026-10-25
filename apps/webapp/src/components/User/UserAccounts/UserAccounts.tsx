import {Stack} from '@mui/material';
import {headers} from 'next/headers';
import {getTranslations} from 'next-intl/server';
import {authClient} from '@/authClient';
import {Card} from '@/components/Card';
import {AccountList} from './AccountList';

export const UserAccounts = async () => {
  const t = await getTranslations('UserAccounts');
  const {data, error} = await authClient.listAccounts({
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
        <AccountList accounts={data ?? []} />
      </Card.Body>
    </Card>
  );
};
