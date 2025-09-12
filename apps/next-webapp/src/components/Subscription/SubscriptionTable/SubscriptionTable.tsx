'use client';

import { CategoryChip } from '@/components/Category/CategoryChip';
import {
  EntityDrawer,
  EntityDrawerFormHandler,
  entityDrawerReducer,
  getInitialEntityDrawerState,
} from '@/components/Drawer';
import { PaymentMethodChip } from '@/components/PaymentMethod/PaymentMethodChip';
import { useSnackbarContext } from '@/components/Snackbar';
import { EntityMenu, EntityTable } from '@/components/Table/EntityTable';
import { subscriptionSlice } from '@/lib/features/subscriptions/subscriptionSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logger } from '@/logger';
import { CategoryService } from '@/services/Category.service';
import { PaymentMethodService } from '@/services/PaymentMethod.service';
import { SubscriptionService } from '@/services/Subscription.service';
import { TransactionService } from '@/services/Transaction.service';
import {
  type TSubscription,
  type TExpandedSubscription,
  type TCategory_VH,
  type TPaymentMethod_VH,
} from '@/types';
import { Formatter } from '@/utils/Formatter';
import { Button, Stack, TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';

type EntityFormFields = Pick<
  TSubscription,
  'ID' | 'toCategory_ID' | 'toPaymentMethod_ID' | 'receiver' | 'transferAmount' | 'information'
> & { executeAt: Date };

export type SubscriptionTableProps = {};

export const SubscriptionTable: React.FC<SubscriptionTableProps> = () => {
  const { showSnackbar } = useSnackbarContext();
  const { refresh, getPage, setPage, setRowsPerPage, applyFilters } = subscriptionSlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: subscriptions,
    filter: filters,
  } = useAppSelector(subscriptionSlice.selectors.getState);
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>()
  );

  const closeEntityDrawer = () => {
    dispatchDrawerAction({ type: 'CLOSE' });
  };

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (
    payload,
    onSuccess
  ) => {
    const action = drawerState.action;
    console.log('Action:', action);
    console.log('Payload:', payload);
    // if (action == 'CREATE') {
    //   // const [createdSubscription, error] = await SubscriptionService.create(payload);
    //   // if (error) {
    //   //   return showSnackbar({
    //   //     message: `Failed to create subscription: ${error.message}`,
    //   //     action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
    //   //   });
    //   // }
    //   showSnackbar({ message: `Subscription created successfully` });
    //   dispatchDrawerAction({ type: 'CLOSE' });
    //   dispatch(refresh());
    // } else if (action == 'EDIT') {
    //   const entityId = drawerState.defaultValues?.ID;
    //   if (!entityId) {
    //     return showSnackbar({
    //       message: `Failed to update subscription: Missing entity ID`,
    //       action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
    //     });
    //   }
    //   // const [updatedSubscription, error] = await SubscriptionService.update(entityId, payload);
    //   // if (error) {
    //   //   return showSnackbar({
    //   //     message: `Failed to update subscription: ${error.message}`,
    //   //     action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
    //   //   });
    //   // }
    //   showSnackbar({ message: `Subscription updated successfully` });
    //   dispatchDrawerAction({ type: 'CLOSE' });
    //   dispatch(refresh());
    // }
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

  const handleEditEntity = (entity: TExpandedSubscription) => {
    const now = new Date();
    const executeAt = entity.executeAt;
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        ID: entity.ID,
        executeAt: new Date(now.getFullYear(), now.getMonth(), executeAt),
        receiver: entity.receiver,
        transferAmount: entity.transferAmount,
        information: entity.information,
      },
    });
  };

  const handleTogglePauseOnEntity = async (entity: TExpandedSubscription) => {
    const [_, error] = await SubscriptionService.update(entity.ID, {
      paused: !entity.paused,
    });
    if (error) {
      return showSnackbar({
        message: `Failed to update subscription: ${error.message}`,
        action: <Button onClick={() => handleTogglePauseOnEntity(entity)}>Retry</Button>,
      });
    }
    showSnackbar({ message: `Subscription updated successfully` });
    dispatchDrawerAction({ type: 'CLOSE' });
    dispatch(refresh());
  };

  const handleDeleteEntity = async (entity: TExpandedSubscription) => {
    const [success, error] = await SubscriptionService.delete(entity.ID);
    if (error || !success) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entity)}>Retry</Button>,
      });
    }

    showSnackbar({ message: `Subscription deleted successfully` });
    dispatch(refresh());
  };

  const handleTextSearch = React.useCallback(
    (text: string) => {
      dispatch(
        applyFilters({
          keyword: text,
        })
      );
    },
    [applyFilters]
  );

  const dispatchNewPage = React.useCallback(
    (newPage: number) => {
      if (newPage < 0) {
        logger.warn('Tried to set page to a negative number, ignoring!');
        return;
      }

      dispatch(setPage(newPage));
    },
    [dispatch, setPage, rowsPerPage]
  );

  const dispatchNewRowsPerPage = React.useCallback(
    (newRowsPerPage: number) => {
      // TODO: Implement validation, in order to ensure that only an valid option is passed
      dispatch(setRowsPerPage(newRowsPerPage));
    },
    [dispatch, setRowsPerPage]
  );

  // Retrieve new data, every time the page is changed
  React.useEffect(() => {
    dispatch(
      getPage({
        page: currentPage,
        rowsPerPage: rowsPerPage,
      })
    );
  }, [dispatch, getPage, currentPage, rowsPerPage]);

  return (
    <React.Fragment>
      <EntityTable<TExpandedSubscription>
        title="Subscriptions"
        subtitle="Manage your recurring payments"
        error={error}
        slots={{
          title: { showCount: true },
          noResults: {
            text: filters.keyword
              ? `No subscriptions found for "${filters.keyword}"`
              : 'No subscriptions found',
          },
          search: {
            enabled: true,
            placeholder: 'Search subscriptions…',
            onSearch: handleTextSearch,
          },
          create: { enabled: true, onClick: handleCreateEntity },
        }}
        totalEntityCount={totalEntityCount}
        isLoading={status === 'loading'}
        data={subscriptions}
        dataKey={'ID'}
        pagination={{
          count: totalEntityCount,
          page: currentPage,
          rowsPerPage: rowsPerPage,
          onChangePage(newPage) {
            return dispatchNewPage(newPage);
          },
          onChangeRowsPerPage(newRowsPerPage) {
            return dispatchNewRowsPerPage(newRowsPerPage);
          },
        }}
        headerCells={[
          { key: 'nextExecution', label: 'Execute at' },
          { key: 'receiver', label: 'Details' },
          { key: 'transferAmount', label: 'Transfer Amount' },
          { key: 'information', label: 'Information' },
          { placeholder: true },
        ]}
        renderRow={(cell, item, data) => {
          const key = cell;
          const rowKey = String(item[key]);
          return (
            <TableRow key={rowKey}>
              <TableCell>
                <Typography
                  variant="body1"
                  sx={{
                    textDecoration: item.paused ? 'line-through' : 'unset',
                  }}
                >
                  {Formatter.date.format(item.nextExecution)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body1">{item.receiver}</Typography>
                <Stack flexDirection={'row'}>
                  <CategoryChip categoryName={item.toCategory.name} size="small" sx={{ mr: 1 }} />
                  <PaymentMethodChip paymentMethodName={item.toPaymentMethod.name} size="small" />
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {Formatter.currency.formatBalance(item.transferAmount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body1">{item.information}</Typography>
              </TableCell>
              <TableCell align="right">
                <EntityMenu<TExpandedSubscription>
                  entity={item}
                  handleEditEntity={handleEditEntity}
                  handleDeleteEntity={handleDeleteEntity}
                  actions={[
                    {
                      children: item.paused ? 'Resume' : 'Pause',
                      onClick: () => handleTogglePauseOnEntity(item),
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          );
        }}
      />

      <EntityDrawer<EntityFormFields>
        title={'Subscription'}
        subtitle={drawerState.action === 'CREATE' ? 'Create new subscription' : 'Edit subscription'}
        open={drawerState.isOpen}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
        closeOnBackdropClick
        onResetForm={() => {
          return {
            ID: '',
            // executeAt: ,
            receiver: '',
            transferAmount: undefined,
            information: '',
          };
        }}
        defaultValues={drawerState.defaultValues ?? undefined}
        fields={[
          {
            type: 'date',
            name: 'executeAt',
            label: 'Execute at',
            placeholder: 'Execute at',
            required: true,
          },
          // Category_VH
          {
            type: 'autocomplete',
            name: 'toCategory_ID',
            label: 'Category',
            placeholder: 'Category',
            required: true,
            retrieveOptionsFunc: async () => {
              const [categories, error] = await CategoryService.getCategoryVH();
              if (error) {
                logger.error('Failed to fetch receiver options:', error);
                return [];
              }
              return categories ?? [];
            },
            getOptionLabel: (option) => {
              return (option as TCategory_VH).name;
            },
            noOptionsText: 'No categories found',
          },
          // PaymentMethod_VH
          {
            type: 'autocomplete',
            name: 'toPaymentMethod_ID',
            label: 'Payment Method',
            placeholder: 'Payment Method',
            required: true,
            retrieveOptionsFunc: async () => {
              const [paymentMethods, error] = await PaymentMethodService.getPaymentMethodVH();
              if (error) {
                logger.error('Failed to fetch payment method options:', error);
                return [];
              }
              return paymentMethods ?? [];
            },
            getOptionLabel: (option) => {
              return (option as TPaymentMethod_VH).name;
            },
            noOptionsText: 'No payment methods found',
          },
          // Receiver_VH
          {
            type: 'autocomplete',
            name: 'receiver',
            label: 'Receiver',
            placeholder: 'Receiver',
            required: true,
            retrieveOptionsFunc: async () => {
              const [receivers, error] = await TransactionService.getReceiverVH();
              if (error) {
                logger.error('Failed to fetch receiver options:', error);
                return [];
              }
              return receivers ?? [];
            },
            getOptionLabel: (option) => {
              return (option as { receiver: string }).receiver;
            },
            noOptionsText: 'No receivers found',
          },
          {
            type: 'number',
            name: 'transferAmount',
            label: 'Transfer Amount',
            placeholder: 'Transfer Amount',
            required: true,
          },
          {
            type: 'text',
            name: 'information',
            label: 'Information',
            placeholder: 'Information',
            area: true,
            rows: 2,
          },
        ]}
      />
    </React.Fragment>
  );
};
