'use client';

import {CategoryVH, type TCategoryVH} from '@budgetbuddyde/api/category';
import {PaymentMethodVH, type TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {
  CreateOrUpdateRecurringPaymentPayload,
  type TExpandedRecurringPayment,
  type TRecurringPayment,
} from '@budgetbuddyde/api/recurringPayment';
import {ReceiverVH, type TReceiverVH} from '@budgetbuddyde/api/transaction';
import {AddRounded} from '@mui/icons-material';
import {Button, Chip, createFilterOptions, InputAdornment, Stack, Typography} from '@mui/material';
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
import {PaymentMethodChip} from '@/components/PaymentMethod/PaymentMethodChip';
import {useSnackbarContext} from '@/components/Snackbar';
import {type ColumnDefinition, EntityMenu, type EntitySlice, EntityTable} from '@/components/Table';
import {recurringPaymentSlice} from '@/lib/features/recurringPayments/recurringPaymentSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';

type EntityFormFields = FirstLevelNullable<
  Pick<
    TRecurringPayment,
    'id' | /*'categoryId' | 'paymentMethodId' | 'receiver' |*/ 'transferAmount' | 'information'
  > & {
    // Because we're gonna use a Date Picker and Autocompletes for relations, we need to override those types
    executeAt: Date;
    category: TCategoryVH;
    paymentMethod: TPaymentMethodVH;
    receiver: TReceiverVH | ({new: true; label: string} & TReceiverVH);
  }
>;

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type RecurringPaymentTableProps = {};

export const RecurringPaymentTable: React.FC<RecurringPaymentTableProps> = () => {
  const {showSnackbar} = useSnackbarContext();
  const {refresh, getPage, setPage, setRowsPerPage, applyFilters} = recurringPaymentSlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: recurringPayments,
    filter: filters,
  } = useAppSelector(recurringPaymentSlice.selectors.getState);
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>(),
  );
  const [deleteDialogState, dispatchDeleteDialogAction] = React.useReducer(
    deleteDialogReducer,
    getInitialDeleteDialogState<TRecurringPayment['id']>(),
  );

  const closeEntityDrawer = () => {
    dispatchDrawerAction({type: 'CLOSE'});
  };

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (payload, onSuccess) => {
    const action = drawerState.action;

    const parsedPayload = CreateOrUpdateRecurringPaymentPayload.omit({
      paused: true,
      executeAt: true,
      categoryId: true,
      paymentMethodId: true,
    })
      .extend({
        executeAt: z.date(),
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
        message: `Failed to ${action === 'CREATE' ? 'create' : 'update'} recurring payment: ${issues}`,
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const {executeAt, category, paymentMethod, receiver, information, transferAmount} = parsedPayload.data;
      const [createdRecurringPayment, error] = await apiClient.backend.recurringPayment.create({
        paused: false,
        executeAt: executeAt.getDate(),
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        receiver: receiver.receiver,
        information: information && information.length > 0 ? information : null,
        transferAmount: transferAmount,
      });
      if (!createdRecurringPayment || error) {
        return showSnackbar({
          message: `Failed to create recurring payment: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({
        message: createdRecurringPayment.message ?? 'Recurring payment created successfully',
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update recurring payment: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      const {executeAt, category, paymentMethod, receiver, information, transferAmount} = parsedPayload.data;
      const [updatedRecurringPayment, error] = await apiClient.backend.recurringPayment.updateById(entityId, {
        executeAt: executeAt.getDate(),
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        receiver: receiver.receiver,
        information: information && information.length > 0 ? information : null,
        transferAmount: transferAmount,
      });
      if (!updatedRecurringPayment || error) {
        return showSnackbar({
          message: `Failed to update recurring payment: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({
        message: updatedRecurringPayment.message ?? 'Recurring payment updated successfully',
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    }
  };

  const handleCreateEntity = () => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'CREATE',
      defaultValues: {
        executeAt: new Date(),
      },
    });
  };

  const handleEditEntity = ({
    id,
    executeAt,
    receiver,
    category,
    paymentMethod,
    transferAmount,
    information,
  }: TExpandedRecurringPayment) => {
    const now = new Date();
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        id,
        executeAt: new Date(now.getFullYear(), now.getMonth(), executeAt),
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

  const handleTogglePauseOnEntity = async (entity: TExpandedRecurringPayment) => {
    const [updatedRecurringPayment, error] = await apiClient.backend.recurringPayment.updateById(entity.id, {
      paused: !entity.paused,
    });
    if (!updatedRecurringPayment || error) {
      return showSnackbar({
        message: `Failed to update recurring payment: ${error.message}`,
        action: <Button onClick={() => handleTogglePauseOnEntity(entity)}>Retry</Button>,
      });
    }
    showSnackbar({
      message: updatedRecurringPayment.message ?? 'Recurring payment updated successfully',
    });
    dispatchDrawerAction({type: 'CLOSE'});
    dispatch(refresh());
  };

  const handleDeleteEntity = async (entityId: TExpandedRecurringPayment['id']) => {
    const [deletedRecurringPayment, error] = await apiClient.backend.recurringPayment.deleteById(entityId);
    if (!deletedRecurringPayment || error) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entityId)}>Retry</Button>,
      });
    }

    showSnackbar({
      message: deletedRecurringPayment.message ?? 'Recurring payment deleted successfully',
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
          name: 'executeAt',
          label: 'Execute at',
          placeholder: 'Execute at',
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

  const columns: ColumnDefinition<TExpandedRecurringPayment>[] = React.useMemo(
    () => [
      {
        key: 'executeAt',
        label: 'Execute at',
        renderCell: (_value, row) => (
          <Typography
            variant="body1"
            sx={{
              textDecoration: row.paused ? 'line-through' : 'unset',
            }}
          >
            {Formatter.date.format(apiClient.backend.recurringPayment.determineNextExecutionDate(row.executeAt))}
          </Typography>
        ),
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
        key: 'id' as keyof TExpandedRecurringPayment,
        label: '',
        align: 'right',
        renderCell: (_value, row) => (
          <EntityMenu<TExpandedRecurringPayment>
            entity={row}
            handleEditEntity={handleEditEntity}
            handleDeleteEntity={({id}) => {
              dispatchDeleteDialogAction({action: 'OPEN', target: id});
            }}
            actions={[
              {
                children: row.paused ? 'Resume' : 'Pause',
                onClick: () => handleTogglePauseOnEntity(row),
              },
            ]}
          />
        ),
      },
    ],
    // biome-ignore lint/correctness/useExhaustiveDependencies: handlers are stable within render context
    [handleEditEntity, handleTogglePauseOnEntity],
  );

  const slice: EntitySlice<TExpandedRecurringPayment> = React.useMemo(
    () => ({
      data: recurringPayments ?? [],
      isLoading: status === 'loading',
      error,
      totalCount: totalEntityCount,
    }),
    [recurringPayments, status, error, totalEntityCount],
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

  return (
    <React.Fragment>
      <EntityTable<TExpandedRecurringPayment, 'id'>
        slice={slice}
        dataKey="id"
        columns={columns}
        toolbar={{
          title: 'Recurring Payments',
          subtitle: 'Manage your recurring payments',
          showCount: true,
          searchPlaceholder: 'Search…',
          onSearch: handleTextSearch,
          actions: [
            {
              id: 'create-recurring-payment',
              icon: <AddRounded />,
              label: 'Create',
              onClick: handleCreateEntity,
            },
          ],
        }}
        emptyMessage={
          filters.keyword ? `No recurring payments found for "${filters.keyword}"` : 'No recurring payments found'
        }
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
        title={'Subscription'}
        subtitle={drawerState.action === 'CREATE' ? 'Create recurring payment' : 'Edit recurring payment'}
        open={drawerState.isOpen}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
        closeOnBackdropClick
        onResetForm={() => {
          return {
            ID: null,
            executeAt: new Date(),
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
            ? 'Are you sure you want to delete this recurring payment?'
            : `Are you sure you want to delete these ${deleteDialogState.target.length} recurring payments?`,
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
        <AddFab onClick={handleCreateEntity} label="Add recurring payment" />
      </FabContainer>
    </React.Fragment>
  );
};
