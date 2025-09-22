'use client';

import { CategoryChip } from '@/components/Category/CategoryChip';
import {
  EntityDrawer,
  type EntityDrawerField,
  type EntityDrawerFormHandler,
  entityDrawerReducer,
  type FirstLevelNullable,
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
  type TReceiverVH,
  CreateOrUpdateSubscription,
  PaymentMethod_VH,
  Category_VH,
  ReceiverVH,
  CdsDate,
} from '@/types';
import { Formatter } from '@/utils/Formatter';
import {
  Button,
  Chip,
  createFilterOptions,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

type EntityFormFields = FirstLevelNullable<
  Pick<
    TSubscription,
    | 'ID'
    | /*'toCategory_ID' | 'toPaymentMethod_ID' | 'receiver' |*/ 'transferAmount'
    | 'information'
  > & {
    // Because we're gonna use a Date Picker and Autocompletes for relations, we need to override those types
    executeAt: Date;
    toCategory: TCategory_VH;
    toPaymentMethod: TPaymentMethod_VH;
    receiver: TReceiverVH | ({ new: true; label: string } & TReceiverVH);
  }
>;

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

    const parsedPayload = CreateOrUpdateSubscription.omit({
      ID: true,
      executeAt: true,
      receiver: true,
      toCategory_ID: true,
      toPaymentMethod_ID: true,
    })
      .extend({
        executeAt: CdsDate,
        toCategory: Category_VH,
        toPaymentMethod: PaymentMethod_VH,
        receiver: ReceiverVH,
      })
      .safeParse({ ...payload, transferAmount: Number(payload.transferAmount) });
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map((issue) => issue.message).join(', ');
      showSnackbar({
        message: `Failed to ${action === 'CREATE' ? 'create' : 'update'} subscription: ${issues}`,
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
      });
      return;
    }

    if (action == 'CREATE') {
      const { executeAt, toCategory, toPaymentMethod, receiver, information, transferAmount } =
        parsedPayload.data;
      const [_, error] = await SubscriptionService.create({
        executeAt: executeAt.getDate(),
        toCategory_ID: toCategory.ID,
        toPaymentMethod_ID: toPaymentMethod.ID,
        receiver: receiver.receiver,
        information: information && information.length > 0 ? information : null,
        transferAmount: transferAmount,
      });
      if (error) {
        return showSnackbar({
          message: `Failed to create subscription: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({ message: `Subscription created successfully` });
      dispatchDrawerAction({ type: 'CLOSE' });
      onSuccess?.();
      dispatch(refresh());
    } else if (action == 'EDIT') {
      const entityId = drawerState.defaultValues?.ID;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update subscription: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      const { executeAt, toCategory, toPaymentMethod, receiver, information, transferAmount } =
        parsedPayload.data;
      const [_, error] = await SubscriptionService.update(entityId, {
        executeAt: executeAt.getDate(),
        toCategory_ID: toCategory.ID,
        toPaymentMethod_ID: toPaymentMethod.ID,
        receiver: receiver.receiver,
        information: information && information.length > 0 ? information : null,
        transferAmount: transferAmount,
      });
      if (error) {
        return showSnackbar({
          message: `Failed to update subscription: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({ message: `Subscription updated successfully` });
      dispatchDrawerAction({ type: 'CLOSE' });
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
    ID,
    executeAt,
    receiver,
    toCategory,
    toPaymentMethod,
    transferAmount,
    information,
  }: TExpandedSubscription) => {
    const now = new Date();
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        ID,
        executeAt: new Date(now.getFullYear(), now.getMonth(), executeAt),
        receiver: { receiver: receiver },
        toCategory: {
          ID: toCategory.ID,
          name: toCategory.name,
          description: toCategory.description,
        },
        toPaymentMethod: {
          ID: toPaymentMethod.ID,
          name: toPaymentMethod.name,
          address: toPaymentMethod.address,
          provider: toPaymentMethod.provider,
          description: toPaymentMethod.description,
        },
        transferAmount,
        information,
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

  // @ts-expect-error REVISIT: Fix the typing
  const EntityFormFields: EntityDrawerField<EntityFormFields>[] = React.useMemo(() => {
    return [
      {
        type: 'date',
        name: 'executeAt',
        label: 'Execute at',
        placeholder: 'Execute at',
        required: true,
      },
      {
        size: { xs: 12, md: 6 },
        type: 'autocomplete',
        name: 'toCategory',
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
        getOptionLabel: (option: TCategory_VH) => {
          return option.name;
        },
        isOptionEqualToValue(option: TCategory_VH, value: TCategory_VH) {
          return option.ID === value.ID;
        },
        noOptionsText: 'No categories found',
      },
      {
        size: { xs: 12, md: 6 },
        type: 'autocomplete',
        name: 'toPaymentMethod',
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
        getOptionLabel: (option: TPaymentMethod_VH) => {
          return option.name;
        },
        isOptionEqualToValue(option: TPaymentMethod_VH, value: TPaymentMethod_VH) {
          return option.ID === value.ID;
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
          const [categories, error] = await TransactionService.getReceiverVH();
          if (error) {
            logger.error('Failed to fetch receiver options:', error);
            return [];
          }
          return categories ?? [];
        },
        getOptionLabel: (option: EntityFormFields['receiver']) => {
          return option?.receiver;
        },
        isOptionEqualToValue(
          option: EntityFormFields['receiver'],
          value: EntityFormFields['receiver']
        ) {
          return option?.receiver === value?.receiver;
        },
        filterOptions: (options, state) => {
          if (state.inputValue.length < 1) return options;
          const filter = createFilterOptions<(typeof options)[0]>({ ignoreCase: true });
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
              {isNew && <Chip label="New" size="small" sx={{ mr: 0.5 }} />}
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
        rowHeight={83.5}
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
    </React.Fragment>
  );
};
