'use client';

import { CategoryChip } from '@/components/Category/CategoryChip';
import { type Command, useCommandPalette } from '@/components/CommandPalette';
import {
  EntityDrawer,
  EntityDrawerField,
  EntityDrawerFormHandler,
  entityDrawerReducer,
  getInitialEntityDrawerState,
  type FirstLevelNullable,
} from '@/components/Drawer';
import { PaymentMethodChip } from '@/components/PaymentMethod/PaymentMethodChip';
import { useSnackbarContext } from '@/components/Snackbar';
import { EntityMenu, EntityTable } from '@/components/Table/EntityTable';
import { transactionSlice } from '@/lib/features/transactions/transactionSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logger } from '@/logger';
import { CategoryService } from '@/services/Category.service';
import { PaymentMethodService } from '@/services/PaymentMethod.service';
import { TransactionService } from '@/services/Transaction.service';
import {
  type TCategory_VH,
  type TPaymentMethod_VH,
  type TReceiverVH,
  type TTransaction,
  type TExpandedTransaction,
  CreateOrUpdateTransaction,
  CdsDate,
  Category_VH,
  PaymentMethod_VH,
  ReceiverVH,
} from '@/types';
import { Formatter } from '@/utils/Formatter';
import { ReceiptRounded } from '@mui/icons-material';
import {
  Button,
  Chip,
  createFilterOptions,
  InputAdornment,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

type EntityFormFields = FirstLevelNullable<
  Pick<
    TTransaction,
    | 'ID'
    | 'processedAt'
    | /*'toCategory_ID' | 'toPaymentMethod_ID' | 'receiver' |*/ 'transferAmount'
    | 'information'
  > & {
    // Because we're gonna use Autocompletes for relations, we need to override those types
    toCategory: TCategory_VH;
    toPaymentMethod: TPaymentMethod_VH;
    receiver: TReceiverVH | ({ new: true; label: string } & TReceiverVH);
  }
>;

export type TransactionTableProps = {};

export const TransactionTable: React.FC<TransactionTableProps> = () => {
  const { register: registerCommand, unregister: unregisterCommand } = useCommandPalette();
  const { showSnackbar } = useSnackbarContext();
  const { refresh, getPage, setPage, setRowsPerPage, applyFilters } = transactionSlice.actions;
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

    const parsedPayload = CreateOrUpdateTransaction.omit({
      ID: true,
      processedAt: true,
      receiver: true,
      toCategory_ID: true,
      toPaymentMethod_ID: true,
    })
      .extend({
        processedAt: CdsDate,
        toCategory: Category_VH,
        toPaymentMethod: PaymentMethod_VH,
        receiver: ReceiverVH,
      })
      .safeParse({ ...payload, transferAmount: Number(payload.transferAmount) });
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map((issue) => issue.message).join(', ');
      showSnackbar({
        message: `Failed to ${action === 'CREATE' ? 'create' : 'update'} transaction: ${issues}`,
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
      });
      return;
    }

    if (action == 'CREATE') {
      const { processedAt, toCategory, toPaymentMethod, receiver, information, transferAmount } =
        parsedPayload.data;
      const [_, error] = await TransactionService.create({
        processedAt: processedAt,
        toCategory_ID: toCategory.ID,
        toPaymentMethod_ID: toPaymentMethod.ID,
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
      showSnackbar({ message: `Transaction created successfully` });
      dispatchDrawerAction({ type: 'CLOSE' });
      onSuccess?.();
      dispatch(refresh());
    } else if (action == 'EDIT') {
      const entityId = drawerState.defaultValues?.ID;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update transaction: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      const { processedAt, toCategory, toPaymentMethod, receiver, information, transferAmount } =
        parsedPayload.data;
      const [_, error] = await TransactionService.update(entityId, {
        processedAt: processedAt,
        toCategory_ID: toCategory.ID,
        toPaymentMethod_ID: toPaymentMethod.ID,
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
      showSnackbar({ message: `Transaction updated successfully` });
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
        processedAt: new Date(),
      },
    });
  };

  const handleEditEntity = ({
    ID,
    processedAt,
    receiver,
    toCategory,
    toPaymentMethod,
    transferAmount,
    information,
  }: TExpandedTransaction) => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        ID,
        processedAt,
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

  const handleDeleteEntity = async (entity: TExpandedTransaction) => {
    const [success, error] = await TransactionService.delete(entity.ID);
    if (error || !success) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entity)}>Retry</Button>,
      });
    }

    showSnackbar({ message: `Transaction deleted successfully` });
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
        name: 'processedAt',
        label: 'Processed at',
        placeholder: 'Processed at',
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

  // Retrieve new data, every time the page is changed
  React.useEffect(() => {
    dispatch(
      getPage({
        page: currentPage,
        rowsPerPage: rowsPerPage,
      })
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
    return () => unregisterCommand(commands.map((c) => c.id));
  }, []);

  return (
    <React.Fragment>
      <EntityTable<TExpandedTransaction>
        title="Transactions"
        subtitle="Manage your transactions"
        error={error}
        slots={{
          title: { showCount: true },
          noResults: {
            text: filters.keyword
              ? `No transactions found for "${filters.keyword}"`
              : 'No transactions found',
          },
          search: {
            enabled: true,
            placeholder: 'Search transactions…',
            onSearch: handleTextSearch,
          },
          create: { enabled: true, onClick: handleCreateEntity },
        }}
        totalEntityCount={totalEntityCount}
        isLoading={status === 'loading'}
        data={transactions}
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
          { key: 'processedAt', label: 'Processed at' },
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
                <Typography variant="body1">{Formatter.date.format(item.processedAt)}</Typography>
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
                <EntityMenu<TExpandedTransaction>
                  entity={item}
                  handleEditEntity={handleEditEntity}
                  handleDeleteEntity={handleDeleteEntity}
                />
              </TableCell>
            </TableRow>
          );
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
    </React.Fragment>
  );
};
