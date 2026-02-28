'use client';

import {CategoryVH, type TCategoryVH} from '@budgetbuddyde/api/category';
import {PaymentMethodVH, type TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {
  CreateOrUpdateTransactionPayload,
  ReceiverVH,
  type TExpandedTransaction,
  type TReceiverVH,
  type TTransaction,
} from '@budgetbuddyde/api/transaction';
import {AddRounded, ReceiptRounded} from '@mui/icons-material';
import {Button, Chip, createFilterOptions, InputAdornment, Stack, Typography} from '@mui/material';
import React from 'react';
import z from 'zod';
import {apiClient} from '@/apiClient';
import {CategoryChip} from '@/components/Category/CategoryChip';
import {type Command, useCommandPalette} from '@/components/CommandPalette';
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
import {PaymentMethodChip} from '@/components/PaymentMethod/PaymentMethodChip';
import {useSnackbarContext} from '@/components/Snackbar';
import {type ColumnDefinition, EntityMenu, type EntitySlice, EntityTable} from '@/components/Table';
import {transactionSlice} from '@/lib/features/transactions/transactionSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';

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

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type TransactionTableProps = {};

export const TransactionTable: React.FC<TransactionTableProps> = () => {
  const {register: registerCommand, unregister: unregisterCommand} = useCommandPalette();
  const {showSnackbar} = useSnackbarContext();
  const {refresh, getPage, setPage, setRowsPerPage, applyFilters} = transactionSlice.actions;
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
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>(),
  );
  const [deleteDialogState, dispatchDeleteDialogAction] = React.useReducer(
    deleteDialogReducer,
    getInitialDeleteDialogState<TTransaction['id']>(),
  );

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

  const handleEditEntity = ({
    id,
    processedAt,
    receiver,
    category,
    paymentMethod,
    transferAmount,
    information,
  }: TExpandedTransaction) => {
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
  };

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

  const handleTextSearch = React.useCallback(
    (text: string) => {
      dispatch(
        applyFilters({
          keyword: text,
        }),
      );
    },
    [applyFilters, dispatch],
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
        renderCell: value => <Typography variant="body1">{Formatter.date.format(value as Date)}</Typography>,
      },
      {
        key: 'receiver',
        label: 'Details',
        renderCell: (_value, row) => (
          <>
            <Typography variant="body1">{row.receiver}</Typography>
            <Stack flexDirection={'row'}>
              <CategoryChip categoryName={row.category.name} size="small" sx={{mr: 1}} />
              <PaymentMethodChip paymentMethodName={row.paymentMethod.name} size="small" />
            </Stack>
          </>
        ),
      },
      {
        key: 'transferAmount',
        label: 'Transfer Amount',
        renderCell: value => (
          <Typography variant="body1">{Formatter.currency.formatBalance(value as number)}</Typography>
        ),
      },
      {
        key: 'information',
        label: 'Information',
        renderCell: value => <Typography variant="body1">{(value as string | null) ?? 'No information'}</Typography>,
      },
      {
        key: 'id' as keyof TExpandedTransaction,
        label: '',
        align: 'right',
        renderCell: (_value, row) => (
          <EntityMenu<TExpandedTransaction>
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
    [handleEditEntity],
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

  // Retrieve new data, every time the page is changed
  React.useEffect(() => {
    dispatch(
      getPage({
        page: currentPage,
        rowsPerPage: rowsPerPage,
      }),
    );
  }, [dispatch, getPage, currentPage, rowsPerPage]);

  React.useEffect(() => {
    const commands: Command[] = [
      {
        id: 'create-transaction',
        label: 'Create Transaction',
        section: 'Transaction',
        icon: <ReceiptRounded />,
        onSelect: () => {
          handleCreateEntity();
        },
      },
    ];
    registerCommand(commands);
    return () => unregisterCommand(commands.map(c => c.id));
  }, [handleCreateEntity, registerCommand, unregisterCommand]);

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
          searchPlaceholder: 'Search transactions…',
          onSearch: handleTextSearch,
          actions: [
            {
              id: 'create-transaction',
              icon: <AddRounded />,
              label: 'Create',
              onClick: handleCreateEntity,
            },
          ],
        }}
        emptyMessage={filters.keyword ? `No transactions found for "${filters.keyword}"` : 'No transactions found'}
        withSelection
        onDeleteSelectedEntities={entities => {
          dispatchDeleteDialogAction({action: 'OPEN', target: entities});
        }}
        pagination={{
          page: currentPage,
          rowsPerPage: rowsPerPage,
          onPageChange: dispatchNewPage,
          onRowsPerPageChange: dispatchNewRowsPerPage,
        }}
        rowHeight={83.5}
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
    </React.Fragment>
  );
};
