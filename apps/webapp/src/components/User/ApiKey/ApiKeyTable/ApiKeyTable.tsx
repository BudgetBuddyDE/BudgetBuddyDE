'use client';

import {AddRounded, DeleteRounded, KeyboardArrowDownRounded, KeyboardArrowUpRounded} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {formatDistanceToNowStrict} from 'date-fns';
import React from 'react';
import {appConfig} from '@/appConfig';
import {authClient} from '@/authClient';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {deleteDialogReducer, getInitialDeleteDialogState} from '@/components/Dialog';
import {type EntityDrawerFormHandler, entityDrawerReducer, getInitialEntityDrawerState} from '@/components/Drawer';
import {ErrorAlert} from '@/components/ErrorAlert';
import {AddFab, FabContainer} from '@/components/FAB';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {useSnackbarContext} from '@/components/Snackbar';
import {Pagination} from '@/components/Table';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useConsumeIntent} from '@/lib/ibn';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';
import {ApiKeyCreateDrawer} from '../ApiKeyCreateDrawer';
import {ApiKeyDeleteDialog} from '../ApiKeyDeleteDialog';
import {CreatedApiKeyDialog} from '../CreatedApiKeyDialog';
import {type ApiKey, type ApiKeyFormFields, type CreatedKeyDialogState, initialCreatedKeyDialogState} from '../types';
import {getApiKeySummary, getDaysUntilDate, isActive, isExpired} from '../utils';
import {ApiKeyDetail} from './ApiKeyDetail';
import {ApiKeyStatistic} from './ApiKeyStatistic';
export const ApiKeyTable: React.FC = () => {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();

  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(appConfig.tables.itemPerPage);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdKeyDialog, setCreatedKeyDialog] = React.useState<CreatedKeyDialogState>(initialCreatedKeyDialogState);
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<ApiKeyFormFields>(),
  );
  const [deleteDialog, dispatchDeleteDialog] = React.useReducer(
    deleteDialogReducer,
    getInitialDeleteDialogState<string>(),
  );
  const [expandedKeyId, setExpandedKeyId] = React.useState<ApiKey['id'] | null>(null);

  const fetchApiKeys = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {data, error: fetchError} = await authClient.apiKey.list({
        query: {
          sortBy: 'createdAt',
          sortDirection: 'desc',
        },
      });

      if (fetchError) {
        setError(fetchError.message ?? t('account.apiKeys.failedToFetchAPIKeys'));
        return;
      }

      const nextApiKeys = (data?.apiKeys as ApiKey[]) ?? [];
      const nextTotalCount = data?.total ?? nextApiKeys.length;
      setApiKeys(nextApiKeys);
      setTotalCount(nextTotalCount);
    } catch (err) {
      if (err instanceof Error) logger.error('Error fetching API keys', err);
      else logger.error('Error fetching API keys', {reason: String(err)});
      setError(t('account.apiKeys.anUnexpectedErrorOccurredWhileLoadingAPIKeys'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  React.useEffect(() => {
    setPage(currentPage => Math.min(currentPage, Math.max(0, Math.ceil(totalCount / rowsPerPage) - 1)));
  }, [rowsPerPage, totalCount]);

  const handleCreateEntity = React.useCallback(() => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'CREATE',
      defaultValues: {
        name: null,
        expiresAt: null,
      },
    });
  }, []);

  const closeEntityDrawer = () => {
    dispatchDrawerAction({type: 'CLOSE'});
  };

  const handleFormSubmission: EntityDrawerFormHandler<ApiKeyFormFields> = async (payload, onSuccess) => {
    const name = payload.name?.trim();
    if (!name) {
      showSnackbar({message: t('account.apiKeys.pleaseProvideANameForTheAPIKey')});
      return;
    }

    const expiresInDays = payload.expiresAt ? getDaysUntilDate(payload.expiresAt) : null;
    if (expiresInDays !== null && expiresInDays <= 0) {
      showSnackbar({message: t('account.apiKeys.expirationDateMustBeInTheFuture')});
      return;
    }

    setIsCreating(true);
    try {
      const expiresIn = expiresInDays ? expiresInDays * 24 * 60 * 60 : undefined;
      const {data, error: createError} = await authClient.apiKey.create({
        name,
        ...(expiresIn ? {expiresIn} : {}),
      });

      if (createError) {
        showSnackbar({
          message: t('account.apiKeys.failedToCreateAPIKeyValue1', {
            value1: createError.message ?? t('account.apiKeys.unknownError'),
          }),
          action: (
            <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('account.apiKeys.retry')}</Button>
          ),
        });
        return;
      }

      const createdKey = (data as {key?: string} | null)?.key;
      if (!createdKey) {
        showSnackbar({message: t('account.apiKeys.apiKeyCreatedButTheKeyValueWasNotReturned')});
      } else {
        setCreatedKeyDialog({
          key: createdKey,
          copied: false,
          acknowledged: false,
        });
        showSnackbar({message: t('account.apiKeys.apiKeyCreatedSuccessfully')});
      }

      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      fetchApiKeys();
    } catch (err) {
      if (err instanceof Error) logger.error('Error creating API key', err);
      else logger.error('Error creating API key', {reason: String(err)});
      showSnackbar({message: t('account.apiKeys.anUnexpectedErrorOccurredWhileCreatingTheAPIKey')});
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEntity = async (target: string | string[]) => {
    const keyIds = Array.isArray(target) ? target : [target];

    await Promise.all(
      keyIds.map(async keyId => {
        const {error: deleteError} = await authClient.apiKey.delete({keyId});
        if (deleteError) {
          throw new Error(deleteError.message ?? t('account.apiKeys.failedToDeleteAPIKey'));
        }
      }),
    );

    showSnackbar({
      message:
        keyIds.length === 1
          ? t('account.apiKeys.apiKeyDeletedSuccessfully')
          : t('account.apiKeys.countAPIKeysDeletedSuccessfully', {count: keyIds.length}),
    });
    fetchApiKeys();
  };

  const handleDeleteConfirm = (target: string | string[]) => {
    handleDeleteEntity(target).catch(err => {
      if (err instanceof Error) logger.error('Error deleting API key', err);
      else logger.error('Error deleting API key', {reason: String(err)});
      showSnackbar({
        message:
          err instanceof Error ? err.message : t('account.apiKeys.anUnexpectedErrorOccurredWhileDeletingTheAPIKey'),
        action: <Button onClick={() => handleDeleteConfirm(target)}>{t('account.apiKeys.retry')}</Button>,
      });
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard
      .writeText(key)
      .then(() => {
        setCreatedKeyDialog(prev => ({...prev, copied: true}));
        showSnackbar({message: t('account.apiKeys.apiKeyCopiedToClipboard')});
      })
      .catch(err => {
        if (err instanceof Error) logger.error('Error copying API key', err);
        else logger.error('Error copying API key', {reason: String(err)});
        showSnackbar({message: t('account.apiKeys.failedToCopyAPIKey')});
      });
  };

  const handleCloseCreatedKeyDialog = () => {
    if (!createdKeyDialog.acknowledged) {
      return;
    }

    setCreatedKeyDialog(initialCreatedKeyDialogState);
  };

  const handlePageChange = React.useCallback((newPage: number) => {
    if (newPage < 0) {
      logger.warn('Tried to set page to a negative number, ignoring!');
      return;
    }

    setExpandedKeyId(null);
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = React.useCallback((newRowsPerPage: number) => {
    setExpandedKeyId(null);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const handleDeleteApiKeyClick = React.useCallback((apiKeyId: ApiKey['id']) => {
    dispatchDeleteDialog({action: 'OPEN', target: apiKeyId});
  }, []);

  const handleIntentDelete = React.useCallback((id: string) => {
    dispatchDeleteDialog({action: 'OPEN', target: id});
  }, []);

  const handleInvalidIntent = React.useCallback(
    (message: string) => {
      showSnackbar({message});
    },
    [showSnackbar],
  );

  useConsumeIntent('apiKey', {
    onCreate: handleCreateEntity,
    onDelete: handleIntentDelete,
    onInvalid: handleInvalidIntent,
  });

  const summary = React.useMemo(() => getApiKeySummary(apiKeys), [apiKeys]);
  const visibleApiKeys = React.useMemo(
    () => apiKeys.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [apiKeys, page, rowsPerPage],
  );
  const isInitialLoading = isLoading && apiKeys.length === 0;

  return (
    <React.Fragment>
      <Card sx={{p: 0, overflow: 'hidden'}}>
        <Card.Header sx={{mb: 0, gap: 2, px: 2, py: 1.5}}>
          <Card.Title
            component="h2"
            sx={{fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.6, letterSpacing: '0.0075em'}}
          >
            {t('account.apiKeys.apiKeys')}
          </Card.Title>
          <Button onClick={handleCreateEntity} startIcon={<AddRounded />} variant="text" size="small">
            {t('account.apiKeys.createAPIKey')}
          </Button>
        </Card.Header>

        <Card.Body>
          <Grid
            container
            sx={theme => ({
              borderBottom: `1px solid ${theme.palette.divider}`,
              borderTop: `1px solid ${theme.palette.divider}`,
              px: {xs: 2, sm: 0},
              py: 1.5,
            })}
          >
            <Grid size={{xs: 6, md: 4}}>
              <ApiKeyStatistic
                label={t('account.apiKeys.activeKeys')}
                value={isInitialLoading ? null : summary.activeCount}
              />
            </Grid>
            <Grid size={{xs: 6, md: 4}} sx={{position: 'relative', pl: {xs: 2, sm: 0}}}>
              <Divider
                orientation="vertical"
                sx={{position: 'absolute', top: {xs: 1, sm: 0}, bottom: {xs: 1, sm: 0}, left: 0, height: 'auto'}}
              />
              <ApiKeyStatistic
                label={t('account.apiKeys.disabledExpired')}
                value={isInitialLoading ? null : summary.inactiveCount}
              />
            </Grid>
            <Grid size={{xs: 12, md: 4}} sx={{position: 'relative'}}>
              <Divider orientation="horizontal" sx={{display: {xs: 'block', md: 'none'}}} />
              <Divider
                orientation="vertical"
                sx={{
                  display: {xs: 'none', md: 'block'},
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  height: 'auto',
                }}
              />
              <ApiKeyStatistic
                label={t('account.apiKeys.lastCreated')}
                value={
                  isInitialLoading
                    ? null
                    : summary.lastCreated
                      ? formatDistanceToNowStrict(new Date(summary.lastCreated), {addSuffix: true})
                      : t('account.apiKeys.noneYet')
                }
                valueTooltip={summary.lastCreated ? Formatter.date.format(summary.lastCreated) : undefined}
              />
            </Grid>
          </Grid>

          {error && <ErrorAlert error={error} sx={{m: 2}} />}
          {isInitialLoading && <CircularProgress />}
          {!isLoading && !error && apiKeys.length === 0 && (
            <NoResults
              variant="create"
              title={t('account.apiKeys.createYourFirstAPIKey')}
              description={t('account.apiKeys.apiKeysProvideProgrammaticAccessToYourBudgetBuddyAccount')}
              createLabel={t('account.apiKeys.createAPIKey')}
              onCreate={handleCreateEntity}
              sx={{m: 2}}
            />
          )}

          {apiKeys.length > 0 && (
            <TableContainer>
              <Table size="small" aria-label={t('account.apiKeys.apiKeys')}>
                <TableHead>
                  <TableRow>
                    {(
                      [
                        ['Name', 'account.apiKeys.name'],
                        ['Key', 'account.apiKeys.key'],
                        ['Status', 'account.apiKeys.status'],
                        ['Created', 'account.apiKeys.created'],
                      ] as const
                    ).map(([, labelKey]) => (
                      <TableCell key={labelKey}>
                        <Typography variant="body2" sx={{fontWeight: 'bold'}}>
                          {t(labelKey)}
                        </Typography>
                      </TableCell>
                    ))}
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleApiKeys.map(apiKey => {
                    const expanded = expandedKeyId === apiKey.id;
                    const active = isActive(apiKey);
                    const expired = isExpired(apiKey.expiresAt);
                    const status = !apiKey.enabled
                      ? t('account.apiKeys.disabled')
                      : expired
                        ? t('account.apiKeys.expired')
                        : t('account.apiKeys.active');

                    return (
                      <React.Fragment key={apiKey.id}>
                        <TableRow hover>
                          <TableCell>
                            <Typography variant="body2" sx={{fontWeight: 600}}>
                              {apiKey.name || t('account.apiKeys.unnamed')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{color: 'text.secondary', fontFamily: 'monospace', whiteSpace: 'nowrap'}}
                            >
                              {apiKey.start ? `${apiKey.start}...` : t('account.apiKeys.hidden')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={status}
                              size="small"
                              color={active ? 'success' : 'default'}
                              variant={active ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{Formatter.date.format(apiKey.createdAt)}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{whiteSpace: 'nowrap'}}>
                            <Tooltip
                              title={expanded ? t('account.apiKeys.hideDetails') : t('account.apiKeys.showDetails')}
                            >
                              <IconButton
                                size="small"
                                aria-label={
                                  expanded
                                    ? t('account.apiKeys.hideDetailsForAPIKeyName', {name: apiKey.name || apiKey.id})
                                    : t('account.apiKeys.showDetailsForAPIKeyName', {name: apiKey.name || apiKey.id})
                                }
                                aria-expanded={expanded}
                                aria-controls={`api-key-details-${apiKey.id}`}
                                onClick={() => setExpandedKeyId(expanded ? null : apiKey.id)}
                              >
                                {expanded ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('account.apiKeys.deleteAPIKey')}>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={t('account.apiKeys.deleteAPIKeyValue1', {value1: apiKey.name || apiKey.id})}
                                onClick={() => handleDeleteApiKeyClick(apiKey.id)}
                              >
                                <DeleteRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} sx={{p: 0, borderBottom: expanded ? undefined : 0}}>
                            <Collapse id={`api-key-details-${apiKey.id}`} in={expanded} timeout="auto">
                              <Box sx={{p: 2}}>
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: {xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))'},
                                  }}
                                >
                                  <ApiKeyDetail
                                    label={t('account.apiKeys.expires')}
                                    value={Formatter.date.formatNullable(apiKey.expiresAt, t('account.apiKeys.never'))}
                                  />
                                  <ApiKeyDetail
                                    label={t('account.apiKeys.lastRequest')}
                                    value={Formatter.date.formatNullable(
                                      apiKey.lastRequest,
                                      t('account.apiKeys.never'),
                                    )}
                                  />
                                  <ApiKeyDetail
                                    label={t('account.apiKeys.usage')}
                                    value={t('account.apiKeys.countRequests', {count: apiKey.requestCount})}
                                    valueInformation={
                                      apiKey.remaining === null
                                        ? t('account.apiKeys.unlimitedRemaining')
                                        : t('account.apiKeys.countRemaining', {count: apiKey.remaining})
                                    }
                                  />
                                  <ApiKeyDetail
                                    label={t('account.apiKeys.rateLimit')}
                                    value={formatRateLimit(apiKey, t)}
                                  />
                                </Box>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card.Body>

        {apiKeys.length > 0 && (
          <Card.Footer sx={{mt: 2, px: 1, pb: 1, justifyContent: 'flex-end'}}>
            <ActionPaper>
              <Pagination
                count={totalCount}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </ActionPaper>
          </Card.Footer>
        )}
      </Card>

      <ApiKeyCreateDrawer
        open={drawerState.isOpen}
        isLoading={isCreating}
        defaultValues={{
          name: drawerState.defaultValues?.name ?? null,
          expiresAt: drawerState.defaultValues?.expiresAt ?? null,
        }}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
      />

      <ApiKeyDeleteDialog
        open={deleteDialog.isOpen}
        onClose={() => dispatchDeleteDialog({action: 'CLOSE'})}
        onConfirm={() => dispatchDeleteDialog({action: 'CONFIRM', callback: handleDeleteConfirm})}
      />

      <CreatedApiKeyDialog
        apiKey={createdKeyDialog.key}
        copied={createdKeyDialog.copied}
        acknowledged={createdKeyDialog.acknowledged}
        onCopy={handleCopyKey}
        onAcknowledgedChange={acknowledged => {
          setCreatedKeyDialog(prev => ({...prev, acknowledged}));
        }}
        onClose={handleCloseCreatedKeyDialog}
      />

      <FabContainer>
        <AddFab onClick={handleCreateEntity} label={t('account.apiKeys.createAPIKey')} />
      </FabContainer>
    </React.Fragment>
  );
};

const formatRateLimit = (apiKey: ApiKey, t: ReturnType<typeof useAppTranslations>) => {
  if (!apiKey.rateLimitEnabled || !apiKey.rateLimitMax) return t('account.apiKeys.off');

  const duration = Formatter.duration.formatMilliseconds(apiKey.rateLimitTimeWindow, {
    seconds: t('account.apiKeys.s'),
    minutes: t('account.apiKeys.m'),
    hours: t('account.apiKeys.h'),
    days: t('account.apiKeys.d'),
  });
  return `${apiKey.rateLimitMax}/${duration ?? t('account.apiKeys.window')}`;
};
