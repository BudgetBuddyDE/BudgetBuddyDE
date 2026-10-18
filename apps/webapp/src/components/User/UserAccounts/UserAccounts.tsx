import {Stack} from '@mui/material';
import {headers} from 'next/headers';
import {authClient} from '@/authClient';
import {Card} from '@/components/Card';
import {getAppTranslations} from '@/i18n/server';
import {AccountList} from './AccountList';

export const UserAccounts = async () => {
  const t = await getAppTranslations();
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
          <Card.Title>{t('account.linkedAccounts.linkedAccounts')}</Card.Title>
          <Card.Subtitle>{t('account.linkedAccounts.manageYourLinkedAccounts')}</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        <AccountList accounts={data ?? []} />
      </Card.Body>
    </Card>
  );
};
