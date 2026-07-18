'use client';

import {CategoryVH, type TCategoryVH} from '@budgetbuddyde/api/category';
import {PaymentMethodVH, type TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {
  CreateOrUpdateTransactionPayload,
  ReceiverVH,
  type TCreateOrUpdateTransactionPayload,
  type TExpandedTransaction,
  type TReceiverVH,
  type TTransaction,
} from '@budgetbuddyde/api/transaction';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import {Button, Chip, createFilterOptions, InputAdornment, Stack, Typography} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import React from 'react';
import z from 'zod';
import {apiClient} from '@/apiClient';
import {CategoryChip} from '@/components/Category/CategoryChip';
import {DeleteDialog, deleteDialogReducer, getInitialDeleteDialogState} from '@/components/Dialog';
import {
  EntityDrawer,
  type EntityDrawerField,
  type EntityDrawerFormHandler,
  entityDrawerReducer,
  type FirstLevelNullable,
  getInitialEntityDrawerState,
} from '@/components/Drawer';
import {AddFab, FabContainer} from '@/components/FAB';
import {FilterWrapper, serializeTransactionFilters} from '@/components/Filter';
import {PaymentMethodChip} from '@/components/PaymentMethod/PaymentMethodChip';
import {useSnackbarContext} from '@/components/Snackbar';
import {BatchEntityDialog, type ColumnDefinition, EntityMenu, type EntitySlice, EntityTable} from '@/components/Table';
import {TransactionAttachmentPreviewStrip, TransactionAttachmentsDialog} from '@/components/Transaction/Attachments';
import type {EntityFilters} from '@/lib/features/createEntitySlice';
import {transactionSlice} from '@/lib/features/transactions/transactionSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {useConsumeIntent} from '@/lib/ibn';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';
import {
  columns as transactionBatchColumns,
  createEmptyRow as createEmptyTransactionRow,
  fromEntity as transactionDraftFromEntity,
  mapRowsToPayload as mapTransactionRowsToPayload,
  type DraftRow as TransactionDraftRow,
} from './transactionBatchAdapter';

type EntityFormFields = FirstLevelNullable<
  Pick<
    TTransaction,
    'id' | 'processedAt' | /*'categoryId' | 'paymentMethodId' | 'receiver' |*/ 'transferAmount' | 'information'
  > & {
    // Because we're gonna use Autocompletes for relations, we need to override those types
    category: TCategoryVH;
    paymentMethod: TPaymentMethodVH;
    receiver: TReceiverVH | ({new: true; label: string} & TReceiverVH);
  }
>;

export type TransactionTableProps = {
  initialFilters?: Partial<EntityFilters>;
};

export const TransactionTable: React.FC<TransactionTableProps> = ({initialFilters}) => {
  const {showSnackbar} = useSnackbarContext();
  const {refresh, getPage, setPage, setRowsPerPage, applyFilters, setFilters} = transactionSlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: transactions,
    filter: filters,
  } = useAppSelector(transactionSlice.selectors.getState);
  const router = useRouter();
  const pathname = usePathname();

  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>(),
  );
  const [deleteDialogState, dispatchDeleteDialogAction] = React.useReducer(
    deleteDialogReducer,
    getInitialDeleteDialogState<TTransaction['id']>(),
  );
  const [attachmentsDialog, setAttachmentsDialog] = React.useState<{
    open: boolean;
    transaction: TExpandedTransaction | null;
  }>({open: false, transaction: null});
  const [batchDialogState, setBatchDialogState] = React.useState<{
    open: boolean;
    mode: 'CREATE' | 'EDIT';
    initialRows: TransactionDraftRow[];
  }>({open: false, mode: 'CREATE', initialRows: []});
  const [batchCategories, setBatchCategories] = React.useState<TCategoryVH[]>([]);
  const [batchPaymentMethods, setBatchPaymentMethods] = React.useState<TPaymentMethodVH[]>([]);
  const [isBatchSubmitting, setIsBatchSubmitting] = React.useState(false);

  const closeEntityDrawer = () => {
    dispatchDrawerAction({type: 'CLOSE'});
  };

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (payload, onSuccess) => {
    const action = drawerState.action;

    const parsedPayload = CreateOrUpdateTransactionPayload.omit({
      processedAt: true,
      receiver: true,
      categoryId: true,
      paymentMethodId: true,
    })
      .extend({
        processedAt: z.date(),
        category: CategoryVH,
        paymentMethod: PaymentMethodVH,
        receiver: ReceiverVH,
      })
      .safeParse({
        ...payload,
        transferAmount: Number(payload.transferAmount),
      });
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => issue.message).join(', ');
      showSnackbar({
        message: `Failed to ${action === 'CREATE' ? 'create' : 'update'} transaction: ${issues}`,
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const {processedAt, category, paymentMethod, receiver, information, transferAmount} = parsedPayload.data;
      const [_, error] = await apiClient.backend.transaction.create({
        processedAt: processedAt,
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        receiver: receiver.receiver,
        information: information && information.length > 0 ? information : null,
        transferAmount: transferAmount,
      });
      if (error) {
        return showSnackbar({
          message: `Failed to create transaction: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({message: `Transaction created successfully`});
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update transaction: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      const {processedAt, category, paymentMethod, receiver, information, transferAmount} = parsedPayload.data;
      const [_, error] = await apiClient.backend.transaction.updateById(entityId, {
        processedAt: processedAt,
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        receiver: receiver.receiver,
        information: information && information.length > 0 ? information : null,
        transferAmount: transferAmount,
      });
      if (error) {
        return showSnackbar({
          message: `Failed to update transaction: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({message: `Transaction updated successfully`});
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    }
  };

  const handleCreateEntity = React.useCallback(() => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'CREATE',
      defaultValues: {
        processedAt: new Date(),
      },
    });
  }, []);

  const loadBatchValueHelp = React.useCallback(async () => {
    const [categoriesResult, paymentMethodsResult] = await Promise.all([
      apiClient.backend.category.getValueHelp(),
      apiClient.backend.paymentMethod.getValueHelp(),
    ]);
    const [categories, categoriesError] = categoriesResult;
    const [paymentMethods, paymentMethodsError] = paymentMethodsResult;
    if (categoriesError || paymentMethodsError) {
      showSnackbar({
        message: `Failed to load transaction options: ${(categoriesError ?? paymentMethodsError)?.message ?? 'Unknown error'}`,
      });
      return false;
    }
    setBatchCategories(categories ?? []);
    setBatchPaymentMethods(paymentMethods ?? []);
    return true;
  }, [showSnackbar]);

  const handleCreateMultiple = React.useCallback(async () => {
    if (!(await loadBatchValueHelp())) return;
    setBatchDialogState({open: true, mode: 'CREATE', initialRows: [createEmptyTransactionRow()]});
  }, [loadBatchValueHelp]);

  const handleEditSelected = React.useCallback(
    async (entities: TExpandedTransaction[]) => {
      if (!(await loadBatchValueHelp())) return;
      setBatchDialogState({
        open: true,
        mode: 'EDIT',
        initialRows: entities.map(transactionDraftFromEntity),
      });
    },
    [loadBatchValueHelp],
  );

  const handleBatchSubmit = React.useCallback(
    async (payload: TCreateOrUpdateTransactionPayload[]) => {
      setIsBatchSubmitting(true);
      try {
        const result =
          batchDialogState.mode === 'CREATE'
            ? await apiClient.backend.transaction.createMany(payload)
            : await apiClient.backend.transaction.updateMany(
                payload.map((data, index) => ({id: batchDialogState.initialRows[index]?.id ?? '', data})),
              );
        if (result[1]) throw new Error(result[1].message);
        showSnackbar({
          message:
            batchDialogState.mode === 'CREATE'
              ? 'Transactions created successfully'
              : 'Transactions updated successfully',
        });
        dispatch(refresh());
        setBatchDialogState(current => ({...current, open: false}));
      } finally {
        setIsBatchSubmitting(false);
      }
    },
    [batchDialogState, dispatch, refresh, showSnackbar],
  );

  const handleEditEntity = React.useCallback(
    ({id, processedAt, receiver, category, paymentMethod, transferAmount, information}: TExpandedTransaction) => {
      dispatchDrawerAction({
        type: 'OPEN',
        action: 'EDIT',
        defaultValues: {
          id,
          processedAt: processedAt instanceof Date ? processedAt : new Date(processedAt),
          receiver: {receiver: receiver},
          category: {
            id: category.id,
            name: category.name,
            description: category.description,
          },
          paymentMethod: {
            id: paymentMethod.id,
            name: paymentMethod.name,
            address: paymentMethod.address,
            provider: paymentMethod.provider,
            description: paymentMethod.description,
          },
          transferAmount,
          information,
        },
      });
    },
    [],
  );

  const loadTransactionForIntent = React.useCallback(
    async (id: string) => {
      const existingTransaction = transactions?.find(transaction => transaction.id === id);
      if (existingTransaction) return existingTransaction;

      const [transaction, error] = await apiClient.backend.transaction.getById(id);
      if (error) {
        showSnackbar({message: `Failed to open transaction: ${error.message}`});
        return null;
      }
      if (!transaction?.data) {
        showSnackbar({message: 'Transaction not found'});
        return null;
      }
      return transaction.data;
    },
    [showSnackbar, transactions],
  );

  const handleIntentEdit = React.useCallback(
    async (id: string) => {
      const transaction = await loadTransactionForIntent(id);
      if (transaction) handleEditEntity(transaction);
    },
    [handleEditEntity, loadTransactionForIntent],
  );

  const handleIntentDelete = React.useCallback((id: string) => {
    dispatchDeleteDialogAction({action: 'OPEN', target: id as TTransaction['id']});
  }, []);

  const handleIntentAttachmentCreate = React.useCallback(
    async ({id}: {entity: 'transaction'; id: string}) => {
      const transaction = await loadTransactionForIntent(id);
      if (transaction) setAttachmentsDialog({open: true, transaction});
    },
    [loadTransactionForIntent],
  );

  const handleInvalidIntent = React.useCallback(
    (message: string) => {
      showSnackbar({message});
    },
    [showSnackbar],
  );

  useConsumeIntent('transaction', {
    onCreate: handleCreateEntity,
    onEdit: handleIntentEdit,
    onDelete: handleIntentDelete,
    onAttachmentCreate: handleIntentAttachmentCreate,
    onInvalid: handleInvalidIntent,
  });

  const handleDeleteEntity = async (entityId: TExpandedTransaction['id']) => {
    const [deletedTransaction, error] = await apiClient.backend.transaction.deleteById(entityId);
    if (error || !deletedTransaction) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entityId)}>Retry</Button>,
      });
    }

    showSnackbar({
      message: deletedTransaction.message ?? 'Transaction was deleted successfully',
    });
    dispatch(refresh());
  };

  const updateUrl = React.useCallback(
    (newFilters: EntityFilters) => {
      const params = serializeTransactionFilters(newFilters);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname],
  );

  const handleTextSearch = React.useCallback(
    (text: string) => {
      updateUrl({...filters, keyword: text || null});
      dispatch(applyFilters({keyword: text || null}));
    },
    [applyFilters, dispatch, filters, updateUrl],
  );

  const handleFilterApply = React.useCallback(
    (filterValues: Partial<EntityFilters>) => {
      updateUrl({...filters, ...filterValues});
      dispatch(applyFilters(filterValues));
    },
    [applyFilters, dispatch, filters, updateUrl],
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

  const EntityFormFields: EntityDrawerField<EntityFormFields>[] =
    // @ts-expect-error REVISIT: Fix the typing
    React.useMemo(() => {
      return [
        {
          type: 'date',
          name: 'processedAt',
          label: 'Processed at',
          placeholder: 'Processed at',
          required: true,
        },
        {
          size: {xs: 12, md: 6},
          type: 'autocomplete',
          name: 'category',
          label: 'Category',
          placeholder: 'Category',
          required: true,
          retrieveOptionsFunc: async () => {
            const [categories, error] = await apiClient.backend.category.getValueHelp();
            if (error) {
              logger.error('Failed to fetch receiver options:', error);
              return [];
            }
            return categories ?? [];
          },
          getOptionLabel: (option: TCategoryVH) => {
            return option.name;
          },
          isOptionEqualToValue(option: TCategoryVH, value: TCategoryVH) {
            return option.id === value.id;
          },
          noOptionsText: 'No categories found',
        },
        {
          size: {xs: 12, md: 6},
          type: 'autocomplete',
          name: 'paymentMethod',
          label: 'Payment Method',
          placeholder: 'Payment Method',
          required: true,
          retrieveOptionsFunc: async () => {
            const [paymentMethods, error] = await apiClient.backend.paymentMethod.getValueHelp();
            if (error) {
              logger.error('Failed to fetch payment method options:', error);
              return [];
            }
            return paymentMethods ?? [];
          },
          getOptionLabel: (option: TPaymentMethodVH) => {
            return option.name;
          },
          isOptionEqualToValue(option: TPaymentMethodVH, value: TPaymentMethodVH) {
            return option.id === value.id;
          },
          noOptionsText: 'No payment methods found',
        },
        {
          type: 'autocomplete',
          name: 'receiver',
          label: 'Receiver',
          placeholder: 'Receiver',
          required: true,
          retrieveOptionsFunc: async () => {
            const [categories, error] = await apiClient.backend.transaction.getReceiverVH();
            if (error) {
              logger.error('Failed to fetch receiver options:', error);
              return [];
            }
            return categories ?? [];
          },
          getOptionLabel: (option: EntityFormFields['receiver']) => {
            return option?.receiver;
          },
          isOptionEqualToValue(option: EntityFormFields['receiver'], value: EntityFormFields['receiver']) {
            return option?.receiver === value?.receiver;
          },
          filterOptions: (options, state) => {
            if (state.inputValue.length < 1) return options;
            const filter = createFilterOptions<(typeof options)[0]>({
              ignoreCase: true,
            });
            const filtered = filter(options, state);
            return filtered.length > 0
              ? filtered
              : [
                  {
                    new: true,
                    receiver: state.inputValue,
                  },
                ];
          },
          renderOption: (props, option: EntityFormFields['receiver']) => {
            if (!option) return null;
            const isNew = 'new' in option;
            return (
              <li {...props} key={option.receiver}>
                {isNew && <Chip label="New" size="small" sx={{mr: 0.5}} />}
                {option.receiver}
              </li>
            );
          },
          noOptionsText: 'No receivers found',
        },
        {
          type: 'number',
          name: 'transferAmount',
          label: 'Transfer Amount',
          placeholder: 'Transfer Amount',
          required: true,
          slotProps: {
            input: {
              endAdornment: <InputAdornment position="end">&euro;</InputAdornment>,
            },
          },
        },
        {
          type: 'text',
          name: 'information',
          label: 'Information',
          placeholder: 'Information',
          area: true,
          rows: 2,
        },
      ];
    }, []);

  const columns: ColumnDefinition<TExpandedTransaction>[] = React.useMemo(
    () => [
      {
        key: 'processedAt',
        label: 'Processed at',
        width: 96,
        renderCell: value => (
          <Typography variant="body2" noWrap>
            {Formatter.date.format(value as Date)}
          </Typography>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        width: 132,
        renderCell: (_value, row) => (
          <CategoryChip
            categoryName={row.category.name}
            size="small"
            sx={{maxWidth: '100%', '& .MuiChip-label': {overflow: 'hidden', textOverflow: 'ellipsis'}}}
          />
        ),
      },
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        width: 178,
        renderCell: (_value, row) => (
          <PaymentMethodChip
            paymentMethodName={row.paymentMethod.name}
            size="small"
            sx={{maxWidth: '100%', '& .MuiChip-label': {overflow: 'hidden', textOverflow: 'ellipsis'}}}
          />
        ),
      },
      {
        key: 'receiver',
        label: 'Receiver',
        width: 168,
        renderCell: value => (
          <Typography variant="body2" noWrap title={value as string}>
            {value as string}
          </Typography>
        ),
      },
      {
        key: 'transferAmount',
        label: 'Amount',
        align: 'right',
        width: 112,
        renderCell: value => (
          <Typography variant="body2" noWrap>
            {Formatter.currency.formatBalance(value as number)}
          </Typography>
        ),
      },
      {
        key: 'information',
        label: 'Information',
        width: '28%',
        renderCell: value => {
          const information = (value as string | null) ?? 'No information';
          return (
            <Typography
              variant="body2"
              noWrap
              title={information}
              sx={{display: 'block', maxWidth: '100%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis'}}
            >
              {information}
            </Typography>
          );
        },
      },
      {
        key: 'attachments',
        label: 'Attachments',
        align: 'left',
        width: 136,
        renderCell: (_value, row) => (
          <TransactionAttachmentPreviewStrip
            attachments={row.attachments}
            attachmentCount={row.attachmentCount}
            previewLimit={4}
            onClick={() => setAttachmentsDialog({open: true, transaction: row})}
          />
        ),
      },
      {
        key: 'id' as keyof TExpandedTransaction,
        label: '',
        align: 'right',
        width: 72,
        renderCell: (_value, row) => (
          <EntityMenu<TExpandedTransaction>
            entity={row}
            handleEditEntity={handleEditEntity}
            handleDeleteEntity={({id}) => {
              dispatchDeleteDialogAction({action: 'OPEN', target: id});
            }}
            actions={[
              {
                children: (
                  <Stack direction="row" alignItems="center" gap={1}>
                    Attachments
                  </Stack>
                ),
                onClick: () => setAttachmentsDialog({open: true, transaction: row}),
              },
            ]}
          />
        ),
      },
    ],
    // biome-ignore lint/correctness/useExhaustiveDependencies: handleEditEntity is stable within render context
    [handleEditEntity],
  );

  const batchColumns = React.useMemo(
    () => transactionBatchColumns({categories: batchCategories, paymentMethods: batchPaymentMethods}),
    [batchCategories, batchPaymentMethods],
  );

  const slice: EntitySlice<TExpandedTransaction> = React.useMemo(
    () => ({
      data: transactions ?? [],
      isLoading: status === 'loading',
      error,
      totalCount: totalEntityCount,
    }),
    [transactions, status, error, totalEntityCount],
  );

  // Initialize filters from URL params on mount — always dispatch to clear any stale Redux state
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount
  React.useLayoutEffect(() => {
    dispatch(setFilters(initialFilters ?? {}));
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
      <EntityTable<TExpandedTransaction, 'id'>
        slice={slice}
        dataKey="id"
        columns={columns}
        toolbar={{
          title: 'Transactions',
          subtitle: 'Manage your transactions',
          showCount: true,
          showSearch: true,
          searchPlaceholder: 'Search transactions…',
          searchDefaultValue: initialFilters?.keyword ?? undefined,
          onSearch: handleTextSearch,
          actions: [
            {
              id: 'create-transaction',
              icon: <AddRounded />,
              label: 'Create',
              onClick: handleCreateEntity,
            },
            {
              id: 'create-multiple-transactions',
              icon: <AddRounded />,
              label: 'Create multiple',
              onClick: handleCreateMultiple,
            },
          ],
          children: (
            <FilterWrapper
              currentFilters={filters}
              onApply={handleFilterApply}
              withDateRange
              transactionDateQuickFilters={['today', 'thisWeek', 'thisMonth', 'lastMonth']}
              withCategories
              withPaymentMethods
            />
          ),
        }}
        emptyMessage={filters.keyword ? `No transactions found for "${filters.keyword}"` : 'No transactions found'}
        withSelection
        onDeleteSelectedEntities={entities => {
          dispatchDeleteDialogAction({action: 'OPEN', target: entities});
        }}
        selectionActions={[
          {
            icon: <EditRounded fontSize="small" />,
            label: 'Edit selected',
            onClick: handleEditSelected,
          },
        ]}
        pagination={{
          page: currentPage,
          rowsPerPage: rowsPerPage,
          onPageChange: dispatchNewPage,
          onRowsPerPageChange: dispatchNewRowsPerPage,
        }}
      />

      <BatchEntityDialog<TransactionDraftRow, TCreateOrUpdateTransactionPayload>
        open={batchDialogState.open}
        title={batchDialogState.mode === 'CREATE' ? 'Create transactions' : 'Edit transactions'}
        mode={batchDialogState.mode}
        initialRows={batchDialogState.initialRows}
        columns={batchColumns}
        createEmptyRow={createEmptyTransactionRow}
        mapRowsToPayload={mapTransactionRowsToPayload}
        onSubmit={handleBatchSubmit}
        onClose={() => setBatchDialogState(current => ({...current, open: false}))}
        isSubmitting={isBatchSubmitting}
      />

      <EntityDrawer<EntityFormFields>
        title={'Transaction'}
        subtitle={drawerState.action === 'CREATE' ? 'Create new transaction' : 'Edit transaction'}
        open={drawerState.isOpen}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
        closeOnBackdropClick
        onResetForm={() => {
          return {
            ID: null,
            processedAt: new Date(),
            toCategory: null,
            toPaymentMethod: null,
            receiver: null,
            transferAmount: null,
            information: null,
          };
        }}
        defaultValues={drawerState.defaultValues ?? undefined}
        fields={EntityFormFields}
      />
      <DeleteDialog
        open={deleteDialogState.isOpen}
        text={{
          content: !Array.isArray(deleteDialogState.target)
            ? 'Are you sure you want to delete this transaction?'
            : `Are you sure you want to delete these ${deleteDialogState.target.length} transactions?`,
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
        <AddFab onClick={handleCreateEntity} label="Add transaction" />
      </FabContainer>

      <TransactionAttachmentsDialog
        open={attachmentsDialog.open}
        transaction={attachmentsDialog.transaction}
        onClose={() => setAttachmentsDialog({open: false, transaction: null})}
      />
    </React.Fragment>
  );
};
