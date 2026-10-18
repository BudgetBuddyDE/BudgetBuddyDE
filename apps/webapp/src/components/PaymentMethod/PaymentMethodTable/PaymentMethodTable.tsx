'use client';

import {CreateOrUpdatePaymentMethodPayload, type TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {
  AddRounded as AddIcon,
  EditRounded as EditIcon,
  MergeRounded as MergeIcon,
  PostAddRounded as CreateMultipleIcon,
} from '@mui/icons-material';
import {Button, Typography} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import React from 'react';
import {apiClient} from '@/apiClient';
import {DeleteDialog, deleteDialogReducer, getInitialDeleteDialogState} from '@/components/Dialog';
import {
  EntityDrawer,
  type EntityDrawerFormHandler,
  entityDrawerReducer,
  type FirstLevelNullable,
  getInitialEntityDrawerState,
} from '@/components/Drawer';
import {AddFab, FabContainer} from '@/components/FAB';
import {serializeKeywordFilter} from '@/components/Filter';
import {useSnackbarContext} from '@/components/Snackbar';
import {
  BatchEntityDialog,
  type ColumnDefinition,
  EntityMenu,
  type EntitySlice,
  EntityTable,
  type SelectionAction,
} from '@/components/Table';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {paymentMethodSlice} from '@/lib/features/paymentMethods/paymentMethodSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {useConsumeIntent} from '@/lib/ibn';
import {translateValidationIssue} from '@/lib/validation/translateValidationIssue';
import {logger} from '@/logger';
import {
  columns as paymentMethodBatchColumns,
  createEmptyRow as createEmptyPaymentMethodRow,
  fromEntity as paymentMethodDraftFromEntity,
  createMapRowsToPayload as createMapPaymentMethodRowsToPayload,
  type DraftRow as PaymentMethodDraftRow,
} from './paymentMethodBatchAdapter';
import {MergePaymentMethodsDialog, type MergePaymentMethodsForm} from '../MergePaymentMethodsDialog';

type EntityFormFields = FirstLevelNullable<
  Pick<TPaymentMethod, 'id' | 'name' | 'address' | 'provider' | 'description'>
>;

export type PaymentMethodTableProps = {
  initialKeyword?: string;
};

export const PaymentMethodTable: React.FC<PaymentMethodTableProps> = ({initialKeyword}) => {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();
  const {refresh, getPage, setPage, setRowsPerPage, applyFilters, setFilters} = paymentMethodSlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: paymentMethods,
    filter: filters,
  } = useAppSelector(paymentMethodSlice.selectors.getState);
  const router = useRouter();
  const pathname = usePathname();
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>(),
  );
  const [mergeDrawerState, dispatchMergeDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<MergePaymentMethodsForm, 'MERGE'>(),
  );
  const [deleteDialogState, dispatchDeleteDialogAction] = React.useReducer(
    deleteDialogReducer,
    getInitialDeleteDialogState<TPaymentMethod['id']>(),
  );
  const [batchDialogState, setBatchDialogState] = React.useState<{
    open: boolean;
    mode: 'CREATE' | 'EDIT';
    initialRows: PaymentMethodDraftRow[];
  }>({open: false, mode: 'CREATE', initialRows: []});
  const [isBatchSubmitting, setIsBatchSubmitting] = React.useState(false);

  const closeEntityDrawer = () => {
    dispatchDrawerAction({type: 'CLOSE'});
  };

  const handleCreateEntity = React.useCallback(() => {
    dispatchDrawerAction({type: 'OPEN', action: 'CREATE'});
  }, []);

  const handleCreateMultiple = React.useCallback(() => {
    setBatchDialogState({open: true, mode: 'CREATE', initialRows: [createEmptyPaymentMethodRow()]});
  }, []);

  const handleEditSelected = React.useCallback((entities: TPaymentMethod[]) => {
    setBatchDialogState({
      open: true,
      mode: 'EDIT',
      initialRows: entities.map(paymentMethodDraftFromEntity),
    });
  }, []);

  const handleBatchSubmit = React.useCallback(
    async (payload: Array<Parameters<typeof apiClient.backend.paymentMethod.createMany>[0][number]>) => {
      setIsBatchSubmitting(true);
      try {
        const result =
          batchDialogState.mode === 'CREATE'
            ? await apiClient.backend.paymentMethod.createMany(payload)
            : await apiClient.backend.paymentMethod.updateMany(
                payload.map((data, index) => ({id: batchDialogState.initialRows[index]?.id ?? '', data})),
              );
        if (result[1]) {
          throw new Error(result[1].message);
        }
        showSnackbar({
          message:
            batchDialogState.mode === 'CREATE'
              ? t('Payment methods created successfully')
              : t('Payment methods updated successfully'),
        });
        dispatch(refresh());
        setBatchDialogState(current => ({...current, open: false}));
      } finally {
        setIsBatchSubmitting(false);
      }
    },
    [t, batchDialogState, dispatch, refresh, showSnackbar],
  );

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (payload, onSuccess) => {
    const action = drawerState.action;

    const parsedPayload = CreateOrUpdatePaymentMethodPayload.safeParse(payload);
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => translateValidationIssue(issue, t)).join(', ');
      showSnackbar({
        message:
          action === 'CREATE'
            ? t('Failed to create payment method: {issues}', {issues})
            : t('Failed to update payment method: {issues}', {issues}),
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('Retry')}</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const [createdPaymentMethod, error] = await apiClient.backend.paymentMethod.create(parsedPayload.data);
      if (!createdPaymentMethod || error) {
        return showSnackbar({
          message: t('Failed to create payment method: {error}', {error: error.message}),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('Retry')}</Button>,
        });
      }
      showSnackbar({
        message: createdPaymentMethod.message || t('Payment Method created'),
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: t('Failed to update payment method: Missing entity ID'),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('Retry')}</Button>,
        });
      }
      const [updatedPaymentMethod, error] = await apiClient.backend.paymentMethod.updateById(
        entityId,
        parsedPayload.data,
      );
      if (error) {
        return showSnackbar({
          message: t('Failed to update payment method: {error}', {error: error.message}),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('Retry')}</Button>,
        });
      }
      showSnackbar({
        message: updatedPaymentMethod.message || t('Payment Method updated'),
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    }
  };

  const handleEditEntity = React.useCallback((entity: TPaymentMethod) => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        id: entity.id,
        name: entity.name,
        address: entity.address,
        provider: entity.provider,
        description: entity.description,
      },
    });
  }, []);

  const loadPaymentMethodForIntent = React.useCallback(
    async (id: string) => {
      const existingPaymentMethod = paymentMethods?.find(paymentMethod => paymentMethod.id === id);
      if (existingPaymentMethod) return existingPaymentMethod;

      const [paymentMethod, error] = await apiClient.backend.paymentMethod.getById(id);
      if (error) {
        showSnackbar({message: t('Failed to open payment method: {error}', {error: error.message})});
        return null;
      }
      if (!paymentMethod?.data) {
        showSnackbar({message: t('Payment method not found')});
        return null;
      }
      return paymentMethod.data;
    },
    [t, paymentMethods, showSnackbar],
  );

  const handleIntentEdit = React.useCallback(
    async (id: string) => {
      const paymentMethod = await loadPaymentMethodForIntent(id);
      if (paymentMethod) handleEditEntity(paymentMethod);
    },
    [handleEditEntity, loadPaymentMethodForIntent],
  );

  const handleIntentDelete = React.useCallback((id: string) => {
    dispatchDeleteDialogAction({action: 'OPEN', target: id as TPaymentMethod['id']});
  }, []);

  const handleInvalidIntent = React.useCallback(
    (message: string) => {
      showSnackbar({message});
    },
    [showSnackbar],
  );

  useConsumeIntent('paymentMethod', {
    onCreate: handleCreateEntity,
    onEdit: handleIntentEdit,
    onDelete: handleIntentDelete,
    onInvalid: handleInvalidIntent,
  });

  const handleDeleteEntity = async (entityId: TPaymentMethod['id']) => {
    const [deletedPaymentMethod, error] = await apiClient.backend.paymentMethod.deleteById(entityId);
    if (error || !deletedPaymentMethod) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entityId)}>{t('Retry')}</Button>,
      });
    }

    showSnackbar({
      message: deletedPaymentMethod.message ?? t('Payment Method was deleted successfully'),
    });
    dispatch(refresh());
  };

  const handleTextSearch = React.useCallback(
    (text: string) => {
      const params = serializeKeywordFilter({...filters, keyword: text || null});
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
      dispatch(applyFilters({keyword: text || null}));
    },
    [applyFilters, dispatch, filters, pathname, router],
  );

  const dispatchNewPage = React.useCallback(
    (newPage: number) => {
      if (newPage < 0) {
        logger.warn('Tried to set page to a negative number, ignoring!');
        return;
      }

      dispatch(setPage(newPage));
    },
    [dispatch, setPage],
  );

  const dispatchNewRowsPerPage = React.useCallback(
    (newRowsPerPage: number) => {
      // TODO: Implement validation, in order to ensure that only an valid option is passed
      dispatch(setRowsPerPage(newRowsPerPage));
    },
    [dispatch, setRowsPerPage],
  );

  const columns: ColumnDefinition<TPaymentMethod>[] = React.useMemo(
    () => [
      {
        key: 'name',
        label: t('Name'),
        renderCell: value => <Typography variant="body1">{value as string}</Typography>,
      },
      {
        key: 'address',
        label: t('Address'),
        renderCell: value => <Typography variant="body1">{value as string}</Typography>,
      },
      {
        key: 'provider',
        label: t('Provider'),
        renderCell: value => <Typography variant="body1">{value as string}</Typography>,
      },
      {
        key: 'description',
        label: t('Description'),
        renderCell: value => <Typography variant="body1">{(value as string | null) || t('No description')}</Typography>,
      },
      {
        key: 'id' as keyof TPaymentMethod,
        label: '',
        align: 'right',
        renderCell: (_value, row) => (
          <EntityMenu
            entity={row}
            handleEditEntity={handleEditEntity}
            handleDeleteEntity={({id}) => {
              dispatchDeleteDialogAction({action: 'OPEN', target: id});
            }}
          />
        ),
      },
    ],
    // biome-ignore lint/correctness/useExhaustiveDependencies: handleEditEntity is stable within render context
    [t, handleEditEntity],
  );

  const batchColumns = React.useMemo(() => paymentMethodBatchColumns({t}), [t]);

  const slice: EntitySlice<TPaymentMethod> = React.useMemo(
    () => ({
      data: paymentMethods ?? [],
      isLoading: status === 'loading',
      error,
      totalCount: totalEntityCount,
    }),
    [paymentMethods, status, error, totalEntityCount],
  );
  const hasActiveFilters = serializeKeywordFilter(filters).toString().length > 0;

  const selectionActions: SelectionAction<TPaymentMethod>[] = React.useMemo(() => {
    return [
      {
        icon: <EditIcon fontSize="small" />,
        label: t('Edit selected'),
        onClick: handleEditSelected,
      },
      {
        icon: <MergeIcon fontSize="small" />,
        label: t('Merge'),
        onClick(paymentMethods) {
          dispatchMergeDrawerAction({
            type: 'OPEN',
            action: 'MERGE',
            defaultValues: {
              sourcePaymentMethods: paymentMethods,
            },
          });
        },
      },
    ];
  }, [t, handleEditSelected]);

  // Initialize keyword from URL params on mount — always dispatch to clear any stale Redux state
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount
  React.useLayoutEffect(() => {
    dispatch(setFilters({keyword: initialKeyword ?? null}));
  }, []);

  // Retrieve new data, every time the page is changed
  React.useEffect(() => {
    dispatch(
      getPage({
        page: currentPage,
        rowsPerPage: rowsPerPage,
      }),
    );
  }, [dispatch, getPage, currentPage, rowsPerPage]);

  return (
    <React.Fragment>
      <EntityTable<TPaymentMethod, 'id'>
        slice={slice}
        dataKey="id"
        columns={columns}
        toolbar={{
          title: t('Payment Methods'),
          subtitle: t('Manage your payment methods'),
          showCount: true,
          showSearch: true,
          searchPlaceholder: t('Search payment methods…'),
          searchDefaultValue: initialKeyword,
          onSearch: handleTextSearch,
          actions: [
            {
              id: 'create-payment-method',
              icon: <AddIcon />,
              label: t('Create'),
              onClick: handleCreateEntity,
            },
            {
              id: 'create-multiple-payment-methods',
              icon: <CreateMultipleIcon />,
              label: t('Create multiple'),
              onClick: handleCreateMultiple,
            },
          ],
        }}
        emptyMessage={
          filters.keyword
            ? t('No payment methods found for "{keyword}"', {keyword: filters.keyword})
            : t('No payment methods found')
        }
        emptyState={
          paymentMethods !== null && totalEntityCount === 0 && !hasActiveFilters
            ? {
                variant: 'create',
                title: t('Create your first payment method'),
                description: t('Add the accounts, cards, or services you use to pay.'),
                createLabel: t('Create payment method'),
                onCreate: handleCreateEntity,
              }
            : undefined
        }
        withSelection
        onDeleteSelectedEntities={entities => {
          dispatchDeleteDialogAction({action: 'OPEN', target: entities});
        }}
        selectionActions={selectionActions}
        pagination={{
          page: currentPage,
          rowsPerPage: rowsPerPage,
          onPageChange: dispatchNewPage,
          onRowsPerPageChange: dispatchNewRowsPerPage,
        }}
      />

      <BatchEntityDialog<
        PaymentMethodDraftRow,
        Parameters<typeof apiClient.backend.paymentMethod.createMany>[0][number]
      >
        open={batchDialogState.open}
        title={batchDialogState.mode === 'CREATE' ? t('Create payment methods') : t('Edit payment methods')}
        mode={batchDialogState.mode}
        initialRows={batchDialogState.initialRows}
        columns={batchColumns}
        createEmptyRow={createEmptyPaymentMethodRow}
        mapRowsToPayload={createMapPaymentMethodRowsToPayload(t)}
        onSubmit={handleBatchSubmit}
        onClose={() => setBatchDialogState(current => ({...current, open: false}))}
        isSubmitting={isBatchSubmitting}
      />

      <EntityDrawer<EntityFormFields>
        title={t('Payment Method')}
        subtitle={drawerState.action === 'CREATE' ? t('Create new payment method') : t('Edit payment method')}
        open={drawerState.isOpen}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
        closeOnBackdropClick
        onResetForm={() => {
          return {
            ID: null,
            name: null,
            address: null,
            provider: null,
            description: null,
          };
        }}
        defaultValues={drawerState.defaultValues ?? undefined}
        fields={[
          {
            type: 'text',
            name: 'name',
            label: t('Name'),
            placeholder: t('Name'),
            required: true,
          },
          {
            type: 'text',
            name: 'address',
            label: t('Address'),
            placeholder: t('IBAN, E-Mail, Wallet Address, etc.'),
            required: true,
          },
          {
            type: 'text',
            name: 'provider',
            label: t('Provider'),
            placeholder: t('Visa, Mastercard, PayPal, etc.'),
            required: true,
          },
          {
            type: 'text',
            name: 'description',
            label: t('Description'),
            placeholder: t('Description'),
            area: true,
            rows: 2,
          },
        ]}
      />
      <MergePaymentMethodsDialog
        isOpen={mergeDrawerState.isOpen}
        source={mergeDrawerState.defaultValues?.sourcePaymentMethods || []}
        onClose={() => {
          dispatchMergeDrawerAction({type: 'CLOSE'});
        }}
      />
      <DeleteDialog
        open={deleteDialogState.isOpen}
        text={{
          content: `${!Array.isArray(deleteDialogState.target) ? t('Are you sure you want to delete this payment method?') : t('Are you sure you want to delete these {count} payment methods?', {count: deleteDialogState.target.length})}\n${t('This will delete all associated transactions and recurring payments as well.')}`,
        }}
        onCancel={() => {
          dispatchDeleteDialogAction({action: 'CLOSE'});
        }}
        onClose={() => {
          dispatchDeleteDialogAction({action: 'CLOSE'});
        }}
        onConfirm={() => {
          dispatchDeleteDialogAction({
            action: 'CONFIRM',
            callback: id => {
              if (Array.isArray(id)) {
                id.forEach(singleId => {
                  handleDeleteEntity(singleId);
                });
              } else {
                handleDeleteEntity(id);
              }
            },
          });
        }}
      />

      <FabContainer>
        <AddFab onClick={handleCreateEntity} label={t('Add payment method')} />
      </FabContainer>
    </React.Fragment>
  );
};
