'use client';

import {CreateOrUpdateBudgetPayload, type TBudget} from '@budgetbuddyde/api/budget';
import type {TCategoryVH} from '@budgetbuddyde/api/category';
import {AddRounded} from '@mui/icons-material';
import {Box, Button, IconButton, InputAdornment, Stack} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {DeleteDialog, deleteDialogReducer, getInitialDeleteDialogState} from '@/components/Dialog';
import {
  EntityDrawer,
  type EntityDrawerField,
  type EntityDrawerFormHandler,
  entityDrawerReducer,
  type FirstLevelNullable,
  getInitialEntityDrawerState,
} from '@/components/Drawer';
import {ErrorAlert as ErrorComp} from '@/components/ErrorAlert';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {useSnackbarContext} from '@/components/Snackbar';
import {Pagination} from '@/components/Table/EntityTable/Pagination';
import {
  generateDefaultState as generateDefaultTransactionDialogState,
  TransactionDialog,
  reducer as TransactionDialogReducer, TransactionDialogProps,
} from '@/components/Transaction/TransactionDialog';
import {budgetSlice} from '@/lib/features/budgets/budgetSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {logger} from '@/logger';
import {type Budget, BudgetItem, type BudgetItemProps} from './BudgetItem';

type EntityFormFields = FirstLevelNullable<
  Pick<TBudget, 'id' | 'type' | 'name' | 'budget' | 'description'> & {
    toCategories: TCategoryVH[];
  }
>;

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type BudgetListProps = {};

export const BudgetList: React.FC<BudgetListProps> = () => {
  const {showSnackbar} = useSnackbarContext();
  const {refresh, getPage, setPage, setRowsPerPage} = budgetSlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: budgets,
  } = useAppSelector(budgetSlice.selectors.getState);
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>(),
  );
  const [deleteDialogState, dispatchDeleteDialogAction] = React.useReducer(
    deleteDialogReducer,
    getInitialDeleteDialogState<TBudget['id']>(),
  );
  const [transactionDialogState, dispatchTransactionDialogAction] = React.useReducer(
    TransactionDialogReducer,
    generateDefaultTransactionDialogState(),
  );

  const handleCreateEntity = () => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'CREATE',
      defaultValues: {
        id: null,
        type: 'i',
        name: null,
        budget: null,
        description: null,
        toCategories: [],
      },
    });
  };

  const handleEditEntity = ({ID, type, name, budget, description, categories}: Budget) => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        id: ID,
        type,
        name,
        budget,
        description,
        toCategories: categories,
      },
    });
  };

  const handleDeleteEntity = async (entityId: Budget['ID']) => {
    const [success, error] = await apiClient.backend.budget.deleteById(entityId);
    if (error || !success) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entityId)}>Retry</Button>,
      });
    }

    showSnackbar({message: success.message || 'Budget deleted successfully'});
    dispatch(refresh());
  };

  const handleClickEntity: BudgetItemProps['onClickBudget'] = async (_event, budget) => {
    dispatchTransactionDialogAction({action: 'OPEN_AND_FETCH_DATA'});

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const relatedCategories = budget.categories.map(category => category.id);
    const [relatedTransactions, error] = await apiClient.backend.transaction.getAll({
      $dateFrom: firstDayOfMonth,
      $dateTo: today,
      [budget.type === 'i' ? '$categories' : '$excl_categories']: relatedCategories,
    });
    if (error) {
      dispatchTransactionDialogAction({action: 'FETCH_ERROR', error});
      return;
    }

    dispatchTransactionDialogAction({
      action: 'FETCH_SUCCESS',
      transactions: relatedTransactions?.data ? relatedTransactions.data : [],
    });
  };

  const handleCloseTransactionDialog: TransactionDialogProps['onClose'] = () => {
    dispatchTransactionDialogAction({action: 'CLEAR'});
  };

  const closeEntityDrawer = () => {
    dispatchDrawerAction({type: 'CLOSE'});
  };

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (payload, onSuccess) => {
    const action = drawerState.action;
    const categories = payload.toCategories ? payload.toCategories.map(category => category.id) : [];
    const parsedPayload = CreateOrUpdateBudgetPayload.pick({
      type: true,
      name: true,
      budget: true,
      description: true,
      categories: true,
    }).safeParse({
      ...payload,
      budget: Number(payload.budget),
      categories,
    });
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => issue.message).join(', ');
      showSnackbar({
        message: `Failed to validate payload for ${action === 'CREATE' ? 'creation' : 'update'} of budget: ${issues}`,
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const [createdBudgets, error] = await apiClient.backend.budget.create(parsedPayload.data);
      if (!createdBudgets || error) {
        return showSnackbar({
          message: `Failed to create budget: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({
        message: createdBudgets.message || 'Budget created successfully',
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update budget: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }

      const [updatedBudgets, error] = await apiClient.backend.budget.updateById(entityId, {
        ...parsedPayload.data,
        description: parsedPayload.data.description ? parsedPayload.data.description : null,
      });
      if (!updatedBudgets || error) {
        return showSnackbar({
          message: `Failed to create budget: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({
        message: updatedBudgets.message || `Budget updated successfully`,
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    }
  };

  const dispatchNewPage = React.useCallback(
    (newPage: number) => {
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

  const EntityFormFields: EntityDrawerField<EntityFormFields>[] = React.useMemo(() => {
    return [
      {
        type: 'select',
        name: 'type',
        required: true,
        exclusive: true,
        options: [
          {
            label: 'Include',
            value: 'i',
            description: 'Include these categories in the budget',
            descriptionPlacement: 'bottom',
          },
          {
            label: 'Exclude',
            value: 'e',
            description: 'Exclude these categories from the budget',
            descriptionPlacement: 'bottom',
          },
        ],
      },
      {
        type: 'text',
        name: 'name',
        required: true,
        label: 'Name',
        placeholder: 'e.g. Groceries, Rent, ...',
      },
      {
        type: 'number',
        name: 'budget',
        required: true,
        label: 'Budget Amount',
        placeholder: 'e.g. 500.00',
        slotProps: {
          input: {
            endAdornment: <InputAdornment position="end">&euro;</InputAdornment>,
          },
        },
      },
      {
        type: 'autocomplete',
        name: 'toCategories',
        label: 'Categories',
        placeholder: 'Select categories',
        required: true,
        retrieveOptionsFunc: async () => {
          const [categories, error] = await apiClient.backend.category.getValueHelp();
          if (error) {
            logger.error('Failed to fetch category options:', error);
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
        multiple: true,
        disableCloseOnSelect: true,
        noOptionsText: 'No categories found',
      },
      {
        type: 'text',
        name: 'description',
        label: 'Description',
        placeholder: 'e.g. Monthly grocery budget, ...',
        area: true,
        rows: 2,
      },
    ] as EntityDrawerField<EntityFormFields>[];
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
      <Card>
        <Card.Header sx={{mb: 1}}>
          <Box>
            <Card.Title>Budget</Card.Title>
            <Card.Subtitle>Keep your spendings on track</Card.Subtitle>
          </Box>

          <Card.HeaderActions>
            <IconButton color="primary" onClick={handleCreateEntity}>
              <AddRounded />
            </IconButton>
          </Card.HeaderActions>
        </Card.Header>
        <Card.Body>
          <ErrorComp error={error} sx={{my: 1, mb: budgets && budgets.length > 0 ? 1 : 0}} />
          {status === 'loading' ? (
            <CircularProgress />
          ) : budgets !== null && budgets.length > 0 ? (
            <Stack rowGap={1}>
              {budgets.map(({id, name, budget, balance, type, description, categories}) => {
                return (
                  <BudgetItem
                    key={id}
                    budget={{
                      ID: id,
                      name,
                      type,
                      budget,
                      balance,
                      description: description || undefined,
                      categories: categories.map(({category: {id, name, description}}) => ({
                        id,
                        name,
                        description,
                      })),
                    }}
                    onEditBudget={handleEditEntity}
                    onDeleteBudget={({ID}) => {
                      dispatchDeleteDialogAction({
                        action: 'OPEN',
                        target: ID,
                      });
                    }}
                    onClickBudget={handleClickEntity}
                  />
                );
              })}
            </Stack>
          ) : (
            <NoResults text={"You haven't created any budgets yet! Create one..."} />
          )}
        </Card.Body>
        <Card.Footer>
          <ActionPaper sx={{width: 'fit-content', ml: 'auto', mt: 2}}>
            <Pagination
              count={totalEntityCount}
              page={currentPage}
              rowsPerPage={rowsPerPage}
              onChangePage={dispatchNewPage}
              onChangeRowsPerPage={dispatchNewRowsPerPage}
            />
          </ActionPaper>
        </Card.Footer>
      </Card>

      <EntityDrawer<EntityFormFields>
        title={'Budget'}
        subtitle={drawerState.action === 'CREATE' ? 'Create new budget' : 'Edit an budget'}
        open={drawerState.isOpen}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
        closeOnBackdropClick
        onResetForm={() => {
          return {
            ID: null,
            type: 'i',
            name: null,
            budget: null,
            toCategories: [],
          };
        }}
        defaultValues={drawerState.defaultValues ?? undefined}
        fields={EntityFormFields}
      />
      <DeleteDialog
        open={deleteDialogState.isOpen}
        text={{
          content: 'Are you sure you want to delete this budget?',
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
              } else handleDeleteEntity(id);
            },
          });
        }}
      />
      <TransactionDialog {...transactionDialogState} onClose={handleCloseTransactionDialog} />
    </React.Fragment>
  );
};
