'use client';

import AddRounded from '@mui/icons-material/AddRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Skeleton,
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
import {useConsumeIntent} from '@/lib/ibn';
import {logger} from '@/logger';
import {tableHeadBackground} from '@/theme/style';
import {Formatter} from '@/utils/Formatter';
import {ApiKeyCreateDrawer} from '../ApiKeyCreateDrawer';
import {ApiKeyDeleteDialog} from '../ApiKeyDeleteDialog';
import {CreatedApiKeyDialog} from '../CreatedApiKeyDialog';
import {type ApiKey, type ApiKeyFormFields, type CreatedKeyDialogState, initialCreatedKeyDialogState} from '../types';
import {getApiKeySummary, getDaysUntilDate, isActive, isExpired} from '../utils';

export const ApiKeyTable: React.FC = () => {
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
        setError(fetchError.message ?? 'Failed to fetch API keys');
        return;
      }

      const nextApiKeys = (data?.apiKeys as ApiKey[]) ?? [];
      const nextTotalCount = data?.total ?? nextApiKeys.length;
      setApiKeys(nextApiKeys);
      setTotalCount(nextTotalCount);
    } catch (err) {
      if (err instanceof Error) logger.error('Error fetching API keys', err);
      else logger.error('Error fetching API keys', {reason: String(err)});
      setError('An unexpected error occurred while loading API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      showSnackbar({message: 'Please provide a name for the API key'});
      return;
    }

    const expiresInDays = payload.expiresAt ? getDaysUntilDate(payload.expiresAt) : null;
    if (expiresInDays !== null && expiresInDays <= 0) {
      showSnackbar({message: 'Expiration date must be in the future'});
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
          message: `Failed to create API key: ${createError.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
        return;
      }

      const createdKey = (data as {key?: string} | null)?.key;
      if (!createdKey) {
        showSnackbar({message: 'API key created, but the key value was not returned'});
      } else {
        setCreatedKeyDialog({
          key: createdKey,
          copied: false,
          acknowledged: false,
        });
        showSnackbar({message: 'API key created successfully'});
      }

      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      fetchApiKeys();
    } catch (err) {
      if (err instanceof Error) logger.error('Error creating API key', err);
      else logger.error('Error creating API key', {reason: String(err)});
      showSnackbar({message: 'An unexpected error occurred while creating the API key'});
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
          throw new Error(deleteError.message ?? 'Failed to delete API key');
        }
      }),
    );

    showSnackbar({
      message: keyIds.length === 1 ? 'API key deleted successfully' : `${keyIds.length} API keys deleted successfully`,
    });
    fetchApiKeys();
  };

  const handleDeleteConfirm = (target: string | string[]) => {
    handleDeleteEntity(target).catch(err => {
      if (err instanceof Error) logger.error('Error deleting API key', err);
      else logger.error('Error deleting API key', {reason: String(err)});
      showSnackbar({
        message: err instanceof Error ? err.message : 'An unexpected error occurred while deleting the API key',
        action: <Button onClick={() => handleDeleteConfirm(target)}>Retry</Button>,
      });
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard
      .writeText(key)
      .then(() => {
        setCreatedKeyDialog(prev => ({...prev, copied: true}));
        showSnackbar({message: 'API key copied to clipboard'});
      })
      .catch(err => {
        if (err instanceof Error) logger.error('Error copying API key', err);
        else logger.error('Error copying API key', {reason: String(err)});
        showSnackbar({message: 'Failed to copy API key'});
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
            API keys
          </Card.Title>
          <Button onClick={handleCreateEntity} startIcon={<AddRounded />} variant="contained" size="small">
            Create API key
          </Button>
        </Card.Header>

        <Card.Body>
          <Box
            sx={theme => ({
              borderBottom: `1px solid ${theme.palette.divider}`,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'grid',
              gridTemplateColumns: {xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))'},
              px: {xs: 2, sm: 0},
              py: 1.5,
            })}
          >
            <ApiKeyStatistic label="Active keys" value={isInitialLoading ? null : summary.activeCount} />
            <ApiKeyStatistic
              label="Disabled / expired"
              value={isInitialLoading ? null : summary.inactiveCount}
              divider
            />
            <ApiKeyStatistic
              label="Last created"
              value={
                isInitialLoading
                  ? null
                  : summary.lastCreated
                    ? formatDistanceToNowStrict(new Date(summary.lastCreated), {addSuffix: true})
                    : 'None yet'
              }
              valueTooltip={summary.lastCreated ? Formatter.date.format(summary.lastCreated) : undefined}
              divider
            />
          </Box>

          {error && <ErrorAlert error={error} sx={{m: 2}} />}
          {isInitialLoading && <CircularProgress />}
          {!isLoading && !error && apiKeys.length === 0 && (
            <NoResults
              variant="create"
              title="Create your first API key"
              description="API keys provide programmatic access to your Budget Buddy account."
              createLabel="Create API key"
              onCreate={handleCreateEntity}
              sx={{m: 2}}
            />
          )}

          {apiKeys.length > 0 && (
            <TableContainer>
              <Table size="small" aria-label="API keys">
                <TableHead>
                  <TableRow>
                    {['Name', 'Key', 'Status', 'Created'].map(label => (
                      <TableCell key={label} sx={theme => tableHeadBackground(theme)}>
                        <Typography variant="body2" sx={{fontWeight: 'bold'}}>
                          {label}
                        </Typography>
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={theme => tableHeadBackground(theme)} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleApiKeys.map(apiKey => {
                    const expanded = expandedKeyId === apiKey.id;
                    const active = isActive(apiKey);
                    const expired = isExpired(apiKey.expiresAt);
                    const status = !apiKey.enabled ? 'Disabled' : expired ? 'Expired' : 'Active';

                    return (
                      <React.Fragment key={apiKey.id}>
                        <TableRow hover>
                          <TableCell>
                            <Typography variant="body2" sx={{fontWeight: 600}}>
                              {apiKey.name || 'Unnamed'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{color: 'text.secondary', fontFamily: 'monospace', whiteSpace: 'nowrap'}}
                            >
                              {apiKey.start ? `${apiKey.start}...` : 'Hidden'}
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
                            <Tooltip title={expanded ? 'Hide details' : 'Show details'}>
                              <IconButton
                                size="small"
                                aria-label={`${expanded ? 'Hide' : 'Show'} details for API key ${apiKey.name || apiKey.id}`}
                                aria-expanded={expanded}
                                aria-controls={`api-key-details-${apiKey.id}`}
                                onClick={() => setExpandedKeyId(expanded ? null : apiKey.id)}
                              >
                                {expanded ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete API key">
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Delete API key ${apiKey.name || apiKey.id}`}
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
                                    label="Expires"
                                    value={Formatter.date.formatNullable(apiKey.expiresAt)}
                                  />
                                  <ApiKeyDetail
                                    label="Last request"
                                    value={Formatter.date.formatNullable(apiKey.lastRequest)}
                                  />
                                  <ApiKeyDetail
                                    label="Usage"
                                    value={`${apiKey.requestCount} requests`}
                                    valueInformation={
                                      apiKey.remaining === null
                                        ? 'Unlimited remaining'
                                        : `${apiKey.remaining} remaining`
                                    }
                                  />
                                  <ApiKeyDetail label="Rate limit" value={formatRateLimit(apiKey)} />
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
        <AddFab onClick={handleCreateEntity} label="Create API key" />
      </FabContainer>
    </React.Fragment>
  );
};

const ApiKeyStatistic: React.FC<{
  label: string;
  value: string | number | null;
  valueTooltip?: string;
  divider?: boolean;
}> = ({label, value, valueTooltip, divider = false}) => {
  return (
    <Box
      sx={theme => ({
        minWidth: 0,
        px: {xs: 0, sm: 2},
        py: {xs: 1, sm: 0},
        ...(divider && {borderLeft: {sm: `1px solid ${theme.palette.divider}`}}),
      })}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="h6" sx={{fontWeight: 500}}>
        {value === null ? (
          <Skeleton width={label === 'Last created' ? 180 : 48} />
        ) : valueTooltip ? (
          <Tooltip title={valueTooltip}>
            <Box component="span">{value}</Box>
          </Tooltip>
        ) : (
          value
        )}
      </Typography>
    </Box>
  );
};

const ApiKeyDetail: React.FC<{label: string; value: string; valueInformation?: string}> = ({
  label,
  value,
  valueInformation,
}) => (
  <Box>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
    {valueInformation && (
      <Typography color="text.secondary" variant="caption">
        {valueInformation}
      </Typography>
    )}
  </Box>
);

const formatRateLimit = (apiKey: ApiKey) => {
  if (!apiKey.rateLimitEnabled || !apiKey.rateLimitMax) return 'Off';

  const duration = Formatter.duration.formatMilliseconds(apiKey.rateLimitTimeWindow);
  return `${apiKey.rateLimitMax}/${duration ?? 'window'}`;
};
