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
              ? t('paymentMethods.paymentMethodsCreatedSuccessfully')
              : t('paymentMethods.paymentMethodsUpdatedSuccessfully'),
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
            ? t('paymentMethods.failedToCreatePaymentMethodIssues', {issues})
            : t('paymentMethods.failedToUpdatePaymentMethodIssues', {issues}),
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('paymentMethods.retry')}</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const [createdPaymentMethod, error] = await apiClient.backend.paymentMethod.create(parsedPayload.data);
      if (!createdPaymentMethod || error) {
        return showSnackbar({
          message: t('paymentMethods.failedToCreatePaymentMethodError', {error: error.message}),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('paymentMethods.retry')}</Button>,
        });
      }
      showSnackbar({
        message: createdPaymentMethod.message || t('paymentMethods.paymentMethodCreated'),
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: t('paymentMethods.failedToUpdatePaymentMethodMissingEntityID'),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('paymentMethods.retry')}</Button>,
        });
      }
      const [updatedPaymentMethod, error] = await apiClient.backend.paymentMethod.updateById(
        entityId,
        parsedPayload.data,
      );
      if (error) {
        return showSnackbar({
          message: t('paymentMethods.failedToUpdatePaymentMethodError', {error: error.message}),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('paymentMethods.retry')}</Button>,
        });
      }
      showSnackbar({
        message: updatedPaymentMethod.message || t('paymentMethods.paymentMethodUpdated'),
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
        showSnackbar({message: t('paymentMethods.failedToOpenPaymentMethodError', {error: error.message})});
        return null;
      }
      if (!paymentMethod?.data) {
        showSnackbar({message: t('paymentMethods.paymentMethodNotFound')});
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
        action: <Button onClick={() => handleDeleteEntity(entityId)}>{t('paymentMethods.retry')}</Button>,
      });
    }

    showSnackbar({
      message: deletedPaymentMethod.message ?? t('paymentMethods.paymentMethodWasDeletedSuccessfully'),
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
        label: t('paymentMethods.name'),
        renderCell: value => <Typography variant="body1">{value as string}</Typography>,
      },
      {
        key: 'address',
        label: t('paymentMethods.address'),
        renderCell: value => <Typography variant="body1">{value as string}</Typography>,
      },
      {
        key: 'provider',
        label: t('paymentMethods.provider'),
        renderCell: value => <Typography variant="body1">{value as string}</Typography>,
      },
      {
        key: 'description',
        label: t('paymentMethods.description'),
        renderCell: value => (
          <Typography variant="body1">{(value as string | null) || t('paymentMethods.noDescription')}</Typography>
        ),
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
        label: t('paymentMethods.editSelected'),
        onClick: handleEditSelected,
      },
      {
        icon: <MergeIcon fontSize="small" />,
        label: t('paymentMethods.merge'),
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
          title: t('paymentMethods.paymentMethods'),
          subtitle: t('paymentMethods.manageYourPaymentMethods'),
          showCount: true,
          showSearch: true,
          searchPlaceholder: t('paymentMethods.searchPaymentMethods'),
          searchDefaultValue: initialKeyword,
          onSearch: handleTextSearch,
          actions: [
            {
              id: 'create-payment-method',
              icon: <AddIcon />,
              label: t('paymentMethods.create'),
              onClick: handleCreateEntity,
            },
            {
              id: 'create-multiple-payment-methods',
              icon: <CreateMultipleIcon />,
              label: t('paymentMethods.createMultiple'),
              onClick: handleCreateMultiple,
            },
          ],
        }}
        emptyMessage={
          filters.keyword
            ? t('paymentMethods.noPaymentMethodsFoundForKeyword', {keyword: filters.keyword})
            : t('paymentMethods.noPaymentMethodsFound')
        }
        emptyState={
          paymentMethods !== null && totalEntityCount === 0 && !hasActiveFilters
            ? {
                variant: 'create',
                title: t('paymentMethods.createYourFirstPaymentMethod'),
                description: t('paymentMethods.addTheAccountsCardsOrServicesYouUseToPay'),
                createLabel: t('paymentMethods.createPaymentMethod'),
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
        title={
          batchDialogState.mode === 'CREATE'
            ? t('paymentMethods.createPaymentMethods')
            : t('paymentMethods.editPaymentMethods')
        }
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
        title={t('paymentMethods.paymentMethod')}
        subtitle={
          drawerState.action === 'CREATE'
            ? t('paymentMethods.createNewPaymentMethod')
            : t('paymentMethods.editPaymentMethod')
        }
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
            label: t('paymentMethods.name'),
            placeholder: t('paymentMethods.name'),
            required: true,
          },
          {
            type: 'text',
            name: 'address',
            label: t('paymentMethods.address'),
            placeholder: t('paymentMethods.ibanEMailWalletAddressEtc'),
            required: true,
          },
          {
            type: 'text',
            name: 'provider',
            label: t('paymentMethods.provider'),
            placeholder: t('paymentMethods.visaMastercardPayPalEtc'),
            required: true,
          },
          {
            type: 'text',
            name: 'description',
            label: t('paymentMethods.description'),
            placeholder: t('paymentMethods.description'),
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
          content: `${!Array.isArray(deleteDialogState.target) ? t('paymentMethods.areYouSureYouWantToDeleteThisPaymentMethod') : t('paymentMethods.areYouSureYouWantToDeleteTheseCountPaymentMethods', {count: deleteDialogState.target.length})}\n${t('paymentMethods.thisWillDeleteAllAssociatedTransactionsAndRecurringPaymentsAsWell')}`,
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
        <AddFab onClick={handleCreateEntity} label={t('paymentMethods.addPaymentMethod')} />
      </FabContainer>
    </React.Fragment>
  );
};
