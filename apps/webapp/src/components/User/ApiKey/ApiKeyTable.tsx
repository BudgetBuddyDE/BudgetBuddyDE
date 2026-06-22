'use client';

import {AddRounded} from '@mui/icons-material';
import {Button} from '@mui/material';
import React from 'react';
import {appConfig} from '@/appConfig';
import {authClient} from '@/authClient';
import {deleteDialogReducer, getInitialDeleteDialogState} from '@/components/Dialog';
import {type EntityDrawerFormHandler, entityDrawerReducer, getInitialEntityDrawerState} from '@/components/Drawer';
import {AddFab, FabContainer} from '@/components/FAB';
import {useSnackbarContext} from '@/components/Snackbar';
import {EntityTable, type EntitySlice} from '@/components/Table';
import {logger} from '@/logger';
import {ApiKeyCreateDrawer} from './ApiKeyCreateDrawer';
import {ApiKeyDeleteDialog} from './ApiKeyDeleteDialog';
import {CreatedApiKeyDialog} from './CreatedApiKeyDialog';
import {type ApiKey, type ApiKeyFormFields, type CreatedKeyDialogState, initialCreatedKeyDialogState} from './types';
import {useApiKeyTableColumns} from './useApiKeyTableColumns';
import {getDaysUntilDate} from './utils';

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

  const fetchApiKeys = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {data, error: fetchError} = await authClient.apiKey.list({
        query: {
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        },
      });

      if (fetchError) {
        setError(fetchError.message ?? 'Failed to fetch API keys');
        return;
      }

      setApiKeys((data?.apiKeys as ApiKey[]) ?? []);
      setTotalCount(data?.total ?? 0);
    } catch (err) {
      logger.error('Error fetching API keys:', err);
      setError('An unexpected error occurred while loading API keys');
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage]);

  React.useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreateEntity = () => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'CREATE',
      defaultValues: {
        name: null,
        expiresAt: null,
      },
    });
  };

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
      logger.error('Error creating API key:', err);
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
      logger.error('Error deleting API key:', err);
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
        logger.error('Error copying API key:', err);
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

    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = React.useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const handleDeleteApiKeyClick = React.useCallback((apiKeyId: ApiKey['id']) => {
    dispatchDeleteDialog({action: 'OPEN', target: apiKeyId});
  }, []);

  const columns = useApiKeyTableColumns(handleDeleteApiKeyClick);

  const slice: EntitySlice<ApiKey> = React.useMemo(
    () => ({
      data: apiKeys,
      isLoading,
      error,
      totalCount,
    }),
    [apiKeys, error, isLoading, totalCount],
  );

  return (
    <React.Fragment>
      <EntityTable<ApiKey, 'id'>
        slice={slice}
        dataKey="id"
        columns={columns}
        toolbar={{
          title: 'API Keys',
          subtitle: 'Manage programmatic access to Budget Buddy',
          showCount: true,
          actions: [
            {
              id: 'create-api-key',
              icon: <AddRounded />,
              label: 'Create API key',
              onClick: handleCreateEntity,
            },
          ],
        }}
        emptyMessage="No API keys found. Create one to get started."
        pagination={{
          page,
          rowsPerPage,
          onPageChange: handlePageChange,
          onRowsPerPageChange: handleRowsPerPageChange,
        }}
      />

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
