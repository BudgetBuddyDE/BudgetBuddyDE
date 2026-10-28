'use client';

import LinkOffRounded from '@mui/icons-material/LinkOffRounded';
import {Button, Divider, IconButton, List, ListItem, ListItemText, Tooltip, Typography} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {authClient, revalidateSession} from '@/authClient';
import {NoResults} from '@/components/NoResults';
import {useSnackbarContext} from '@/components/Snackbar';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';

export type AccountListProps = {
  accounts: {
    id: string;
    accountId: string;
    userId: string;
    providerId: string;
    scopes: string[];
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export const AccountList: React.FC<AccountListProps> = ({accounts}) => {
  const t = useTranslations('AccountList');
  const {showSnackbar} = useSnackbarContext();

  if (accounts.length === 0) {
    return <NoResults text={t('empty')} sx={{mx: 2}} />;
  }

  const handleAccountUnlink = async (providerId: string, accountId: string) => {
    try {
      const {error} = await authClient.unlinkAccount({providerId, accountId});
      if (error) throw error;

      await revalidateSession(undefined, () => {
        showSnackbar({
          message: t('sessionRevalidateError'),
        });
      });
      showSnackbar({
        message: t('unlinked', {provider: providerId}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (e instanceof Error) logger.error('Error unlinking account', e);
      else logger.error('Error unlinking account', {reason: msg});
      showSnackbar({
        message: msg,
        action: <Button onClick={() => handleAccountUnlink(providerId, accountId)}>{t('retry')}</Button>,
      });
    }
  };

  return (
    <List disablePadding>
      {accounts.map((account, idx, arr) => {
        const accountId = account.id;
        const providerId = account.providerId;
        const createdAt = Formatter.date.format(account.createdAt);
        return (
          <React.Fragment key={account.id}>
            <ListItem
              dense
              secondaryAction={
                <Tooltip title={t('unlink')}>
                  <IconButton
                    edge="end"
                    aria-label={t('unlink')}
                    onClick={() => handleAccountUnlink(providerId, accountId)}
                    size="small"
                  >
                    <LinkOffRounded />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemText
                primary={
                  <React.Fragment>
                    <Typography variant="body2" sx={{mt: 1}}>
                      <strong>{t('provider')}:</strong> {providerId}
                    </Typography>
                    <Typography variant="body2" sx={{mt: 0.5}}>
                      <strong>{t('createdAt')}:</strong> {createdAt}
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
            {idx < arr.length - 1 && <Divider component="li" />}
          </React.Fragment>
        );
      })}
    </List>
  );
};
