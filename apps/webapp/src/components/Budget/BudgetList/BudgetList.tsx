'use client';

import {CreateOrUpdateBudgetPayload, type TBudget} from '@budgetbuddyde/api/budget';
import type {TCategoryVH} from '@budgetbuddyde/api/category';
import AddRounded from '@mui/icons-material/AddRounded';
import {Box, Button, IconButton, InputAdornment, Stack} from '@mui/material';
import {endOfMonth} from 'date-fns';
import {useTranslations} from 'next-intl';
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
import {Pagination} from '@/components/Table/Pagination';
import {
  generateDefaultState as generateDefaultTransactionDialogState,
  TransactionDialog,
  type TransactionDialogProps,
  reducer as TransactionDialogReducer,
} from '@/components/Transaction/TransactionDialog';
import {budgetSlice} from '@/lib/features/budgets/budgetSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {useConsumeIntent} from '@/lib/ibn';
import {logger} from '@/logger';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';
import {type Budget, BudgetItem, type BudgetItemProps} from './BudgetItem';

type EntityFormFields = FirstLevelNullable<
  Pick<TBudget, 'id' | 'type' | 'name' | 'budget' | 'description'> & {
    toCategories: TCategoryVH[];
  }
>;

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type BudgetListProps = {};

function toBudgetItemModel(entity: TBudget): Budget {
  return {
    ID: entity.id,
    name: entity.name,
    type: entity.type,
    budget: entity.budget,
    balance: entity.balance,
    description: entity.description || undefined,
    categories: entity.categories.map(({category: {id, name, description}}) => ({id, name, description})),
  };
}

export const BudgetList: React.FC<BudgetListProps> = () => {
  const t = useTranslations('BudgetList');
  const currency = useCurrencyPreference();
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

  const handleCreateEntity = React.useCallback(() => {
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
  }, []);

  const handleEditEntity = React.useCallback(({ID, type, name, budget, description, categories}: Budget) => {
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
  }, []);

  const loadBudgetForIntent = React.useCallback(
    async (id: string) => {
      const existingBudget = budgets?.find(budget => budget.id === id);
      if (existingBudget) return existingBudget;

      const [budget, error] = await apiClient.backend.budget.getById(id);
      if (error) {
        showSnackbar({message: t('failedToOpen', {message: error.message})});
        return null;
      }
      if (!budget?.data) {
        showSnackbar({message: t('notFound')});
        return null;
      }
      return budget.data;
    },
    [budgets, showSnackbar],
  );

  const handleIntentEdit = React.useCallback(
    async (id: string) => {
      const budget = await loadBudgetForIntent(id);
      if (budget) handleEditEntity(toBudgetItemModel(budget));
    },
    [handleEditEntity, loadBudgetForIntent],
  );

  const handleIntentDelete = React.useCallback((id: string) => {
    dispatchDeleteDialogAction({action: 'OPEN', target: id as TBudget['id']});
  }, []);

  const handleInvalidIntent = React.useCallback(
    (message: string) => {
      showSnackbar({message});
    },
    [showSnackbar],
  );

  useConsumeIntent('budget', {
    onCreate: handleCreateEntity,
    onEdit: handleIntentEdit,
    onDelete: handleIntentDelete,
    onInvalid: handleInvalidIntent,
  });

  const handleDeleteEntity = async (entityId: Budget['ID']) => {
    const [success, error] = await apiClient.backend.budget.deleteById(entityId);
    if (error || !success) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entityId)}>{t('retry')}</Button>,
      });
    }

    showSnackbar({message: success.message || t('deletedSuccessfully')});
    dispatch(refresh());
  };

  const handleClickEntity: BudgetItemProps['onClickBudget'] = async (_event, budget) => {
    dispatchTransactionDialogAction({action: 'OPEN_AND_FETCH_DATA'});

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const relatedCategories = budget.categories.map(category => category.id);
    const [relatedTransactions, error] = await apiClient.backend.transaction.getAll({
      $dateFrom: firstDayOfMonth,
      $dateTo: endOfMonth(today),
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
        message: t('validationFailed', {action: action === 'CREATE' ? t('creation') : t('update'), issues}),
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('retry')}</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const [createdBudgets, error] = await apiClient.backend.budget.create(parsedPayload.data);
      if (!createdBudgets || error) {
        return showSnackbar({
          message: t('createFailed', {message: error.message}),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('retry')}</Button>,
        });
      }
      showSnackbar({
        message: createdBudgets.message || t('createdSuccessfully'),
      });
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: t('updateFailedMissingId'),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('retry')}</Button>,
        });
      }

      const [updatedBudgets, error] = await apiClient.backend.budget.updateById(entityId, {
        ...parsedPayload.data,
        description: parsedPayload.data.description ? parsedPayload.data.description : null,
      });
      if (!updatedBudgets || error) {
        return showSnackbar({
          message: t('updateFailed', {message: error.message}),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('retry')}</Button>,
        });
      }
      showSnackbar({
        message: updatedBudgets.message || t('updatedSuccessfully'),
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
            label: t('include'),
            value: 'i',
            description: t('includeDescription'),
            descriptionPlacement: 'bottom',
          },
          {
            label: t('exclude'),
            value: 'e',
            description: t('excludeDescription'),
            descriptionPlacement: 'bottom',
          },
        ],
      },
      {
        type: 'text',
        name: 'name',
        required: true,
        label: t('name'),
        placeholder: t('namePlaceholder'),
      },
      {
        type: 'number',
        name: 'budget',
        required: true,
        label: t('budgetAmount'),
        placeholder: t('amountPlaceholder'),
        slotProps: {
          input: {
            endAdornment: <InputAdornment position="end">{currency === 'USD' ? '$' : '€'}</InputAdornment>,
          },
        },
      },
      {
        type: 'autocomplete',
        name: 'toCategories',
        label: t('categories'),
        placeholder: t('selectCategories'),
        required: true,
        retrieveOptionsFunc: async () => {
          const [categories, error] = await apiClient.backend.category.getValueHelp();
          if (error) {
            logger.error('Failed to fetch category options', error);
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
        noOptionsText: t('noCategoriesFound'),
      },
      {
        type: 'text',
        name: 'description',
        label: t('description'),
        placeholder: t('descriptionPlaceholder'),
        area: true,
        rows: 2,
      },
    ] as EntityDrawerField<EntityFormFields>[];
  }, [t]);

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
            <Card.Title>{t('title')}</Card.Title>
            <Card.Subtitle>{t('subtitle')}</Card.Subtitle>
          </Box>

          <Card.HeaderActions>
            <IconButton color="primary" aria-label={t('createBudget')} onClick={handleCreateEntity}>
              <AddRounded />
            </IconButton>
          </Card.HeaderActions>
        </Card.Header>
        <Card.Body>
          <ErrorComp error={error} sx={{my: 1, mb: budgets && budgets.length > 0 ? 1 : 0}} />
          {status === 'loading' ? (
            <CircularProgress />
          ) : budgets !== null && budgets.length > 0 ? (
            <Stack
              sx={{
                rowGap: 1,
              }}
            >
              {budgets.map(budget => {
                return (
                  <BudgetItem
                    key={budget.id}
                    budget={toBudgetItemModel(budget)}
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
            <NoResults
              variant="create"
              title={t('emptyTitle')}
              description={t('emptyDescription')}
              createLabel={t('createBudget')}
              onCreate={handleCreateEntity}
              sx={{borderStyle: 'solid'}}
            />
          )}
        </Card.Body>
        <Card.Footer>
          <ActionPaper sx={{width: 'fit-content', ml: 'auto', mt: 2}}>
            <Pagination
              count={totalEntityCount}
              page={currentPage}
              rowsPerPage={rowsPerPage}
              onPageChange={dispatchNewPage}
              onRowsPerPageChange={dispatchNewRowsPerPage}
            />
          </ActionPaper>
        </Card.Footer>
      </Card>

      <EntityDrawer<EntityFormFields>
        title={t('title')}
        subtitle={drawerState.action === 'CREATE' ? t('createNew') : t('edit')}
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
          content: t('confirmDelete'),
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
