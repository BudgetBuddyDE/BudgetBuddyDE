'use client';

import {CreateOrUpdateCategoryPayload, type TCategory} from '@budgetbuddyde/api/category';
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
} from '@/components/Drawer/EntityDrawer';
import {AddFab, FabContainer} from '@/components/FAB';
import {serializeKeywordFilter} from '@/components/Filter';
import {useSnackbarContext} from '@/components/Snackbar';
import {
  BatchEntityDialog,
  type ColumnDefinition,
  EntityMenu,
  type EntitySlice,
  EntityTable,
  type EntityTableProps,
  type SelectionAction,
} from '@/components/Table';
import {
  generateDefaultState as generateDefaultTransactionDialogState,
  TransactionDialog,
  type TransactionDialogProps,
  reducer as TransactionDialogReducer,
} from '@/components/Transaction/TransactionDialog';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {categorySlice} from '@/lib/features/categories/categorySlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {useConsumeIntent} from '@/lib/ibn';
import {translateValidationIssue} from '@/lib/validation/translateValidationIssue';
import {logger} from '@/logger';
import {
  columns as categoryBatchColumns,
  createEmptyRow as createEmptyCategoryRow,
  fromEntity as categoryDraftFromEntity,
  createMapRowsToPayload as createMapCategoryRowsToPayload,
  type DraftRow as CategoryDraftRow,
} from './categoryBatchAdapter';
import {MergeCategoriesDialog, type MergeCategoriesForm} from '../MergeCategoriesDialog';

type EntityFormFields = FirstLevelNullable<Pick<TCategory, 'id' | 'name' | 'description'>>;

export type CategoryTableProps = {
  initialKeyword?: string;
};

export const CategoryTable: React.FC<CategoryTableProps> = ({initialKeyword}) => {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();
  const {refresh, getPage, setPage, setRowsPerPage, applyFilters, setFilters} = categorySlice.actions;
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    currentPage,
    rowsPerPage,
    count: totalEntityCount,
    data: categories,
    filter: filters,
  } = useAppSelector(categorySlice.selectors.getState);
  const router = useRouter();
  const pathname = usePathname();
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>(),
  );
  const [transactionDialogState, dispatchTransactionDialogAction] = React.useReducer(
    TransactionDialogReducer,
    generateDefaultTransactionDialogState(),
  );
  const [mergeDrawerState, dispatchMergeDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<MergeCategoriesForm, 'MERGE'>(),
  );
  const [deleteDialogState, dispatchDeleteDialogAction] = React.useReducer(
    deleteDialogReducer,
    getInitialDeleteDialogState<TCategory['id']>(),
  );
  const [batchDialogState, setBatchDialogState] = React.useState<{
    open: boolean;
    mode: 'CREATE' | 'EDIT';
    initialRows: CategoryDraftRow[];
  }>({open: false, mode: 'CREATE', initialRows: []});
  const [isBatchSubmitting, setIsBatchSubmitting] = React.useState(false);

  const closeEntityDrawer = () => {
    dispatchDrawerAction({type: 'CLOSE'});
  };

  const handleCreateEntity = React.useCallback(() => {
    dispatchDrawerAction({type: 'OPEN', action: 'CREATE'});
  }, []);

  const handleCreateMultiple = React.useCallback(() => {
    setBatchDialogState({open: true, mode: 'CREATE', initialRows: [createEmptyCategoryRow()]});
  }, []);

  const handleEditSelected = React.useCallback((entities: TCategory[]) => {
    setBatchDialogState({
      open: true,
      mode: 'EDIT',
      initialRows: entities.map(categoryDraftFromEntity),
    });
  }, []);

  const handleBatchSubmit = React.useCallback(
    async (payload: Array<Parameters<typeof apiClient.backend.category.createMany>[0][number]>) => {
      setIsBatchSubmitting(true);
      try {
        const result =
          batchDialogState.mode === 'CREATE'
            ? await apiClient.backend.category.createMany(payload)
            : await apiClient.backend.category.updateMany(
                payload.map((data, index) => ({id: batchDialogState.initialRows[index]?.id ?? '', data})),
              );
        if (result[1]) {
          throw new Error(result[1].message);
        }
        showSnackbar({
          message:
            batchDialogState.mode === 'CREATE'
              ? t('categories.categoriesCreatedSuccessfully')
              : t('categories.categoriesUpdatedSuccessfully'),
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
    const parsedPayload = CreateOrUpdateCategoryPayload.safeParse(payload);
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => translateValidationIssue(issue, t)).join(', ');
      showSnackbar({
        message:
          action === 'CREATE'
            ? t('categories.failedToCreateCategoryIssues', {issues})
            : t('categories.failedToUpdateCategoryIssues', {issues}),
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('categories.retry')}</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const [createdCategory, error] = await apiClient.backend.category.create(parsedPayload.data);
      if (!createdCategory || error) {
        return showSnackbar({
          message: t('categories.failedToCreateCategoryError', {error: error.message}),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('categories.retry')}</Button>,
        });
      }
      showSnackbar({message: createdCategory.message || t('categories.categoryCreated')});
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: t('categories.failedToUpdateCategoryMissingEntityID'),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('categories.retry')}</Button>,
        });
      }
      const [updatedCategory, error] = await apiClient.backend.category.updateById(entityId, parsedPayload.data);
      if (error) {
        return showSnackbar({
          message: t('categories.failedToUpdateCategoryError', {error: error.message}),
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('categories.retry')}</Button>,
        });
      }
      showSnackbar({message: updatedCategory.message || t('categories.categoryUpdated')});
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    }
  };

  const handleClickEntity: EntityTableProps<TCategory, 'id'>['onRowClick'] = async (row, _index) => {
    dispatchTransactionDialogAction({action: 'OPEN_AND_FETCH_DATA'});

    const [relatedTransactions, error] = await apiClient.backend.transaction.getAll({
      $categories: [row.id],
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

  const handleEditEntity = React.useCallback((entity: TCategory) => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        id: entity.id,
        name: entity.name,
        description: entity.description,
      },
    });
  }, []);

  const loadCategoryForIntent = React.useCallback(
    async (id: string) => {
      const existingCategory = categories?.find(category => category.id === id);
      if (existingCategory) return existingCategory;

      const [category, error] = await apiClient.backend.category.getById(id);
      if (error) {
        showSnackbar({message: t('categories.failedToOpenCategoryError', {error: error.message})});
        return null;
      }
      if (!category?.data) {
        showSnackbar({message: t('categories.categoryNotFound')});
        return null;
      }
      return category.data;
    },
    [t, categories, showSnackbar],
  );

  const handleIntentEdit = React.useCallback(
    async (id: string) => {
      const category = await loadCategoryForIntent(id);
      if (category) handleEditEntity(category);
    },
    [handleEditEntity, loadCategoryForIntent],
  );

  const handleIntentDelete = React.useCallback((id: string) => {
    dispatchDeleteDialogAction({action: 'OPEN', target: id as TCategory['id']});
  }, []);

  const handleInvalidIntent = React.useCallback(
    (message: string) => {
      showSnackbar({message});
    },
    [showSnackbar],
  );

  useConsumeIntent('category', {
    onCreate: handleCreateEntity,
    onEdit: handleIntentEdit,
    onDelete: handleIntentDelete,
    onInvalid: handleInvalidIntent,
  });

  const handleDeleteEntity = async (entityId: TCategory['id']) => {
    const [deletedCategory, error] = await apiClient.backend.category.deleteById(entityId);
    if (error || !deletedCategory) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entityId)}>{t('categories.retry')}</Button>,
      });
    }

    showSnackbar({
      message: deletedCategory.message ?? t('categories.categoryWasDeletedSuccessfully'),
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

  const columns: ColumnDefinition<TCategory>[] = React.useMemo(
    () => [
      {
        key: 'name',
        label: t('categories.name'),
        renderCell: value => <Typography variant="body1">{value as string}</Typography>,
      },
      {
        key: 'description',
        label: t('categories.description'),
        renderCell: value => (
          <Typography variant="body1">{(value as string | null) || t('categories.noDescription')}</Typography>
        ),
      },
      {
        key: 'id' as keyof TCategory,
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

  const batchColumns = React.useMemo(() => categoryBatchColumns({t}), [t]);

  const slice: EntitySlice<TCategory> = React.useMemo(
    () => ({
      data: categories ?? [],
      isLoading: status === 'loading',
      error,
      totalCount: totalEntityCount,
    }),
    [categories, status, error, totalEntityCount],
  );
  const hasActiveFilters = serializeKeywordFilter(filters).toString().length > 0;

  const selectionActions: SelectionAction<TCategory>[] = React.useMemo(() => {
    return [
      {
        icon: <EditIcon fontSize="small" />,
        label: t('categories.editSelected'),
        onClick: handleEditSelected,
      },
      {
        icon: <MergeIcon fontSize={'small'} />,
        label: t('categories.merge'),
        onClick(categories) {
          dispatchMergeDrawerAction({
            type: 'OPEN',
            action: 'MERGE',
            defaultValues: {
              sourceCategories: categories,
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
      <EntityTable<TCategory, 'id'>
        slice={slice}
        dataKey="id"
        columns={columns}
        toolbar={{
          title: t('categories.categories'),
          subtitle: t('categories.manageYourCategories'),
          showCount: true,
          showSearch: true,
          searchPlaceholder: t('categories.searchCategories'),
          searchDefaultValue: initialKeyword,
          onSearch: handleTextSearch,
          actions: [
            {
              id: 'create-category',
              icon: <AddIcon />,
              label: t('categories.create'),
              onClick: handleCreateEntity,
            },
            {
              id: 'create-multiple-categories',
              icon: <CreateMultipleIcon />,
              label: t('categories.createMultiple'),
              onClick: handleCreateMultiple,
            },
          ],
        }}
        onRowClick={handleClickEntity}
        emptyMessage={
          filters.keyword
            ? t('categories.noCategoriesFoundForKeyword', {keyword: filters.keyword})
            : t('categories.noCategoriesFound')
        }
        emptyState={
          categories !== null && totalEntityCount === 0 && !hasActiveFilters
            ? {
                variant: 'create',
                title: t('categories.createYourFirstCategory'),
                description: t('categories.organizeYourTransactionsWithCategoriesThatMatchYourSpending'),
                createLabel: t('categories.createCategory'),
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

      <BatchEntityDialog<CategoryDraftRow, Parameters<typeof apiClient.backend.category.createMany>[0][number]>
        open={batchDialogState.open}
        title={batchDialogState.mode === 'CREATE' ? t('categories.createCategories') : t('categories.editCategories')}
        mode={batchDialogState.mode}
        initialRows={batchDialogState.initialRows}
        columns={batchColumns}
        createEmptyRow={createEmptyCategoryRow}
        mapRowsToPayload={createMapCategoryRowsToPayload(t)}
        onSubmit={handleBatchSubmit}
        onClose={() => setBatchDialogState(current => ({...current, open: false}))}
        isSubmitting={isBatchSubmitting}
      />

      <EntityDrawer<EntityFormFields>
        title={t('categories.category')}
        subtitle={drawerState.action === 'CREATE' ? t('categories.createNewCategory') : t('categories.editCategory')}
        open={drawerState.isOpen}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
        closeOnBackdropClick
        onResetForm={() => {
          return {
            ID: null,
            name: null,
            description: null,
          };
        }}
        defaultValues={drawerState.defaultValues ?? undefined}
        fields={[
          {
            type: 'text',
            name: 'name',
            label: t('categories.name'),
            placeholder: t('categories.name'),
            required: true,
          },
          {
            type: 'text',
            name: 'description',
            label: t('categories.description'),
            placeholder: t('categories.description'),
            area: true,
            rows: 2,
          },
        ]}
      />
      <MergeCategoriesDialog
        isOpen={mergeDrawerState.isOpen}
        source={mergeDrawerState.defaultValues?.sourceCategories || []}
        onClose={() => {
          dispatchMergeDrawerAction({type: 'CLOSE'});
        }}
      />
      <DeleteDialog
        open={deleteDialogState.isOpen}
        text={{
          content: `${!Array.isArray(deleteDialogState.target) ? t('categories.areYouSureYouWantToDeleteThisCategory') : t('categories.areYouSureYouWantToDeleteTheseCountCategories', {count: deleteDialogState.target.length})}\n${t('categories.thisWillDeleteAllAssociatedTransactionsAndRecurringPaymentsAsWell')}`,
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
      <TransactionDialog {...transactionDialogState} onClose={handleCloseTransactionDialog} />
      <FabContainer>
        <AddFab onClick={handleCreateEntity} label={t('categories.addCategory')} />
      </FabContainer>
    </React.Fragment>
  );
};
