'use client';

import {CreateOrUpdatePaymentMethodPayload, type TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {MergeRounded} from '@mui/icons-material';
import {Button, ListItemIcon, TableCell, Typography} from '@mui/material';
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
import {useSnackbarContext} from '@/components/Snackbar';
import {EntityMenu, EntityTable} from '@/components/Table/EntityTable';
import {paymentMethodSlice} from '@/lib/features/paymentMethods/paymentMethodSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {logger} from '@/logger';
import {MergePaymentMethodsDialog, type MergePaymentMethodsForm} from '../MergePaymentMethodsDialog';

type EntityFormFields = FirstLevelNullable<
  Pick<TPaymentMethod, 'id' | 'name' | 'address' | 'provider' | 'description'>
>;

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type PaymentMethodTableProps = {};

export const PaymentMethodTable: React.FC<PaymentMethodTableProps> = () => {
  const {showSnackbar} = useSnackbarContext();
  const {refresh, getPage, setPage, setRowsPerPage, applyFilters} = paymentMethodSlice.actions;
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

  const closeEntityDrawer = () => {
    dispatchDrawerAction({type: 'CLOSE'});
  };

  const handleCreateEntity = () => {
    dispatchDrawerAction({type: 'OPEN', action: 'CREATE'});
  };

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (payload, onSuccess) => {
    const action = drawerState.action;

    const parsedPayload = CreateOrUpdatePaymentMethodPayload.safeParse(payload);
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => issue.message).join(', ');
      showSnackbar({
        message: `Failed to ${action === 'CREATE' ? 'create' : 'update'} payment method: ${issues}`,
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const [createdPaymentMethod, error] = await apiClient.backend.paymentMethod.create(parsedPayload.data);
      if (!createdPaymentMethod || error) {
        return showSnackbar({
          message: `Failed to create payment method: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({
        message: createdPaymentMethod.message || 'Payment Method created',
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update payment method: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      const [updatedPaymentMethod, error] = await apiClient.backend.paymentMethod.updateById(
        entityId,
        parsedPayload.data,
      );
      if (error) {
        return showSnackbar({
          message: `Failed to update payment method: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({
        message: updatedPaymentMethod.message || 'Payment Method updated',
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    }
  };

  const handleEditEntity = (entity: TPaymentMethod) => {
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
  };

  const handleDeleteEntity = async (entityId: TPaymentMethod['id']) => {
    const [deletedPaymentMethod, error] = await apiClient.backend.paymentMethod.deleteById(entityId);
    if (error || !deletedPaymentMethod) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entityId)}>Retry</Button>,
      });
    }

    showSnackbar({
      message: deletedPaymentMethod.message ?? 'Payment Method was deleted successfully',
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
        title="Payment Methods"
        subtitle="Manage your payment methods"
        error={error}
        slots={{
          title: {showCount: true},
          noResults: {
            text: filters.keyword ? `No payment methods found for "${filters.keyword}"` : 'No payment methods found',
          },
          search: {
            enabled: true,
            placeholder: 'Search payment methods…',
            onSearch: handleTextSearch,
          },
          create: {enabled: true, onClick: handleCreateEntity},
          selection: {
            actions: [
              {
                children: (
                  <>
                    <ListItemIcon>
                      <MergeRounded fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="inherit">Merge</Typography>
                  </>
                ),
                onExecuteAction(_event, paymentMethods) {
                  dispatchMergeDrawerAction({
                    type: 'OPEN',
                    action: 'MERGE',
                    defaultValues: {
                      sourcePaymentMethods: paymentMethods,
                    },
                  });
                },
              },
            ],
          },
        }}
        totalEntityCount={totalEntityCount}
        isLoading={status === 'loading'}
        data={paymentMethods ?? []}
        dataKey={'id'}
        withSelection
        onDeleteSelectedEntities={entites => {
          dispatchDeleteDialogAction({action: 'OPEN', target: entites});
        }}
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
          {key: 'name', label: 'Name'},
          {key: 'address', label: 'Address'},
          {key: 'provider', label: 'Provider'},
          {key: 'description', label: 'Description'},
          {placeholder: true},
        ]}
        renderRow={(cell, item, _data) => {
          const key = cell;
          const _rowKey = String(item[key]);
          return (
            <>
              <TableCell>
                <Typography variant="body1">{item.name}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body1">{item.address}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body1">{item.provider}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body1">{item.description || 'No description'}</Typography>
              </TableCell>
              <TableCell align="right">
                <EntityMenu
                  entity={item}
                  handleEditEntity={handleEditEntity}
                  handleDeleteEntity={({id}) => {
                    dispatchDeleteDialogAction({action: 'OPEN', target: id});
                  }}
                />
              </TableCell>
            </>
          );
        }}
      />

      <EntityDrawer<EntityFormFields>
        title={'Payment Method'}
        subtitle={drawerState.action === 'CREATE' ? 'Create new payment method' : 'Edit payment method'}
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
            label: 'Name',
            placeholder: 'Name',
            required: true,
          },
          {
            type: 'text',
            name: 'address',
            label: 'Address',
            placeholder: 'IBAN, E-Mail, Wallet Address, etc.',
            required: true,
          },
          {
            type: 'text',
            name: 'provider',
            label: 'Provider',
            placeholder: 'Visa, Mastercard, PayPal, etc.',
            required: true,
          },
          {
            type: 'text',
            name: 'description',
            label: 'Description',
            placeholder: 'Description',
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
          content: `${!Array.isArray(deleteDialogState.target) ? 'Are you sure you want to delete this payment method?' : `Are you sure you want to delete these ${deleteDialogState.target.length} payment methods?`}\nThis will delete all associated transactions and recurring payments as well.`,
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
        <AddFab onClick={handleCreateEntity} label="Add payment method" />
      </FabContainer>
    </React.Fragment>
  );
};
