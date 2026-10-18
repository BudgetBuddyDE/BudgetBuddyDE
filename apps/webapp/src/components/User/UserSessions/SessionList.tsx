'use client';

import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {Button, Divider, IconButton, List, ListItem, ListItemText, Stack, Tooltip, Typography} from '@mui/material';
import type {Session} from 'better-auth';
import React from 'react';
import {authClient, revalidateSession} from '@/authClient';
import {NoResults} from '@/components/NoResults';
import {useSnackbarContext} from '@/components/Snackbar';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';

export type SessionListProps = {
  sessions: Session[];
};

export const SessionList: React.FC<SessionListProps> = ({sessions}) => {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();
  if (sessions.length === 0) {
    return <NoResults text={t('No active sessions found.')} sx={{mx: 2}} />;
  }
  const handleRevokeSession = async (token: string) => {
    try {
      const {error} = await authClient.revokeSession({token: token});
      if (error) throw error;

      await revalidateSession();
      showSnackbar({message: t('The session was revoked!')});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (e instanceof Error) logger.error('Error revoking session', e);
      else logger.error('Error revoking session', {reason: msg});
      showSnackbar({
        message: msg,
        action: <Button onClick={() => handleRevokeSession(token)}>{t('Retry')}</Button>,
      });
    }
  };
  return (
    <List disablePadding>
      {sessions.map((session, idx, arr) => {
        const token = session.token;
        const createdAt = Formatter.date.format(session.createdAt);
        const expiresAt = Formatter.date.format(session.expiresAt);
        const userAgent = session.userAgent || t('Unknown User Agent');
        const ipAddress = session.ipAddress || t('Unknown IP Address');
        const key = session.id || session.token || idx;
        const elements = [
          <ListItem
            key={key}
            dense
            secondaryAction={
              <Tooltip title={t('Revoke session')}>
                <IconButton
                  edge="end"
                  aria-label={t('Revoke session')}
                  onClick={() => handleRevokeSession(token)}
                  size="small"
                >
                  <DeleteRounded />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemText
              primary={
                <React.Fragment>
                  <Typography variant="body2" sx={{mt: 1}}>
                    <strong>{t('IP:')}</strong> {ipAddress}
                  </Typography>
                  <Tooltip title={userAgent}>
                    <Typography variant="body2" sx={{mt: 0.5}}>
                      <strong>{t('User Agent:')}</strong>{' '}
                      {userAgent.length > 32 ? `${userAgent.substring(0, 32)}...` : userAgent}
                    </Typography>
                  </Tooltip>
                </React.Fragment>
              }
              secondary={
                <Stack
                  sx={{
                    flexDirection: 'row',
                  }}
                >
                  <Stack
                    sx={{
                      flex: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.primary',
                      }}
                    >
                      {t('Created at')}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                      }}
                    >
                      {createdAt}
                    </Typography>
                  </Stack>
                  <Stack
                    sx={{
                      flex: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.primary',
                      }}
                    >
                      {t('Expires at')}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                      }}
                    >
                      {expiresAt}
                    </Typography>
                  </Stack>
                </Stack>
              }
            />
          </ListItem>,
        ];
        if (idx < arr.length - 1) {
          elements.push(<Divider key={`div-${key}`} component="li" />);
        }
        return elements;
      })}
    </List>
  );
};
