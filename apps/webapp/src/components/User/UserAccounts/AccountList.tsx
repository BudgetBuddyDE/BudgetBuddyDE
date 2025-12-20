'use client';

import {LinkOffRounded} from '@mui/icons-material';
import {Button, Divider, IconButton, List, ListItem, ListItemText, Tooltip, Typography} from '@mui/material';
import React from 'react';
import {authClient, revalidateSession} from '@/authClient';
import {NoResults} from '@/components/NoResults';
import {useSnackbarContext} from '@/components/Snackbar';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';

export type AccountListProps = {
  accounts: {
    id: string;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
    accountId: string;
    scopes: string[];
  }[];
};

export const AccountList: React.FC<AccountListProps> = ({accounts}) => {
  const {showSnackbar} = useSnackbarContext();

  if (accounts.length === 0) {
    return <NoResults text="No linked accounts found." sx={{mx: 2}} />;
  }

  const handleAccountUnlink = async (providerId: string, accountId: string) => {
    try {
      const {error} = await authClient.unlinkAccount({
        providerId,
        accountId,
      });
      if (error) throw error;

      await revalidateSession(undefined, () => {
        showSnackbar({
          message: "Wasn't able to revalidate session after unlinking account",
        });
      });
      showSnackbar({
        message: `Account unlinked successfully from ${providerId}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Error unlinking account: %s', msg);
      showSnackbar({
        message: msg,
        action: <Button onClick={() => handleAccountUnlink(providerId, accountId)}>Retry</Button>,
      });
    }
  };

  return (
    <List disablePadding>
      {accounts.map((account, idx, arr) => {
        const accountId = account.id;
        const providerId = account.provider;
        const createdAt = Formatter.date.format(account.createdAt);
        return (
          <React.Fragment key={account.id}>
            <ListItem
              dense
              secondaryAction={
                <Tooltip title="Unlink account">
                  <IconButton
                    edge="end"
                    aria-label="Unlink account"
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
                      <strong>Provider:</strong> {providerId}
                    </Typography>
                    <Typography variant="body2" sx={{mt: 0.5}}>
                      <strong>CreatedAt:</strong> {createdAt}
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
