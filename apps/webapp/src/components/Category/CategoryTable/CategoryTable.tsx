'use client';

import {CreateOrUpdateCategoryPayload, type TCategory, type TCategoryVH} from '@budgetbuddyde/api/category';
import {BackendError} from '@budgetbuddyde/core/error/BackendError';
import {
  AddRounded as AddIcon,
  EditRounded as EditIcon,
  MergeRounded as MergeIcon,
  PostAddRounded as CreateMultipleIcon,
} from '@mui/icons-material';
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
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
  type SelectionAction,
} from '@/components/Table';
import {
  generateDefaultState as generateDefaultTransactionDialogState,
  TransactionDialog,
  type TransactionDialogProps,
  reducer as TransactionDialogReducer,
} from '@/components/Transaction/TransactionDialog';
import {categorySlice} from '@/lib/features/categories/categorySlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {useConsumeIntent} from '@/lib/ibn';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';
import {
  columns as categoryBatchColumns,
  createEmptyRow as createEmptyCategoryRow,
  fromEntity as categoryDraftFromEntity,
  mapRowsToPayload as mapCategoryRowsToPayload,
  type DraftRow as CategoryDraftRow,
} from './categoryBatchAdapter';
import {MergeCategoriesDialog, type MergeCategoriesForm} from '../MergeCategoriesDialog';

type EntityFormFields = FirstLevelNullable<Pick<TCategory, 'id' | 'name' | 'description'> & {parent: TCategoryVH}>;

export type CategoryTableProps = {
  initialKeyword?: string;
};

export const CategoryTable: React.FC<CategoryTableProps> = ({initialKeyword}) => {
  const t = useTranslations('CategoryTable');
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
  const [hierarchy, setHierarchy] = React.useState<TCategoryVH[]>([]);
  const hierarchyRequest = React.useRef(0);
  const [deletePreview, setDeletePreview] = React.useState<{
    target: typeof deleteDialogState.target;
    scopes: {id: TCategory['id']; childIds: string[]; labels: string[]}[];
  } | null>(null);
  const [deletePreviewError, setDeletePreviewError] = React.useState(false);
  const [detail, setDetail] = React.useState<React.ReactNode>(null);
  const detailRequest = React.useRef(0);
  const [pendingMove, setPendingMove] = React.useState<{
    before: string;
    after: string;
    save: () => Promise<void>;
  } | null>(null);
  const [savingMove, setSavingMove] = React.useState(false);
  const currency = useCurrencyPreference();
  const populatedRoots = React.useMemo(
    () => new Set(hierarchy.flatMap(row => (row.parentId ? [row.parentId] : []))),
    [hierarchy],
  );
  const loadHierarchy = React.useCallback(async () => {
    const request = ++hierarchyRequest.current;
    setHierarchy([]);
    const [rows, error] = await apiClient.backend.category.getValueHelp();
    if (request !== hierarchyRequest.current) return;
    if (rows) setHierarchy(rows);
    else if (error) showSnackbar({message: error.message});
  }, [showSnackbar]);
  React.useEffect(() => {
    void loadHierarchy();
    return () => {
      ++hierarchyRequest.current;
    };
  }, [loadHierarchy]);

  React.useEffect(() => {
    const {isOpen, target} = deleteDialogState;
    if (!isOpen || !target) return;
    let active = true;
    const targets = Array.isArray(target) ? target : [target];
    const ids = new Set(targets);
    void apiClient.backend.category.getValueHelp({cache: 'no-store'}).then(([rows]) => {
      if (!active) return;
      if (!rows || !targets.every(id => rows.some(row => row.id === id))) {
        setDeletePreviewError(true);
        return;
      }
      const scopes = rows
        .filter(row => ids.has(row.id) && (!row.parentId || !ids.has(row.parentId)))
        .map(row => {
          const children = rows.filter(child => child.parentId === row.id);
          return {
            id: row.id,
            childIds: children.map(child => child.id),
            labels: [row.name, ...children.map(child => `${row.name} > ${child.name}`)],
          };
        });
      setDeletePreview({target, scopes});
    });
    return () => {
      active = false;
    };
  }, [deleteDialogState]);

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
            batchDialogState.mode === 'CREATE' ? 'Categories created successfully' : 'Categories updated successfully',
        });
        dispatch(refresh());
        void loadHierarchy();
        setBatchDialogState(current => ({...current, open: false}));
      } finally {
        setIsBatchSubmitting(false);
      }
    },
    [batchDialogState, dispatch, loadHierarchy, refresh, showSnackbar],
  );

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (payload, onSuccess) => {
    const action = drawerState.action;
    const parsedPayload = CreateOrUpdateCategoryPayload.safeParse({...payload, parentId: payload.parent?.id ?? null});
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => issue.message).join(', ');
      showSnackbar({
        message: `Failed to ${action === 'CREATE' ? 'create' : 'update'} category: ${issues}`,
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('retry')}</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const [createdCategory, error] = await apiClient.backend.category.create(parsedPayload.data);
      if (!createdCategory || error) {
        return showSnackbar({
          message: `Failed to create category: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('retry')}</Button>,
        });
      }
      showSnackbar({message: createdCategory.message || 'Category created'});
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
      void loadHierarchy();
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update category: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>{t('retry')}</Button>,
        });
      }
      const {parentId = null, ...changes} = parsedPayload.data;
      const previous = drawerState.defaultValues?.parent;
      const previousParentId = previous?.id ?? null;
      const moving = previousParentId !== parentId;
      const save = async () => {
        const [updatedCategory, error] = moving
          ? await apiClient.backend.category.moveConfirmed(entityId, {...changes, parentId}, previousParentId)
          : await apiClient.backend.category.updateById(entityId, changes);
        if (error) {
          if (moving && error instanceof BackendError && error.statusCode === 409) {
            setPendingMove(null);
            dispatchDrawerAction({type: 'CLOSE'});
            dispatch(refresh());
            void loadHierarchy();
            showSnackbar({
              message: 'Category placement changed. Reopen the category to review and confirm the move again.',
            });
          } else showSnackbar({message: `Failed to update category: ${error.message}`});
          return;
        }
        setPendingMove(null);
        showSnackbar({message: updatedCategory.message || 'Category updated'});
        dispatchDrawerAction({type: 'CLOSE'});
        onSuccess?.();
        dispatch(refresh());
        void loadHierarchy();
      };
      if (moving) {
        setPendingMove({
          before: previous
            ? `${previous.name} > ${drawerState.defaultValues?.name}`
            : `${drawerState.defaultValues?.name} (root)`,
          after: payload.parent
            ? `${payload.parent.name} > ${parsedPayload.data.name}`
            : `${parsedPayload.data.name} (root)`,
          save,
        });
      } else await save();
    }
  };

  const handleClickEntity = async (row: TCategory) => {
    const request = ++detailRequest.current;
    setDetail(null);
    dispatchTransactionDialogAction({action: 'OPEN_AND_FETCH_DATA'});
    const [breakdown, breakdownError] = await apiClient.backend.category.getMonthlyBreakdown(row.id, new Date(), {
      cache: 'no-store',
    });
    if (request !== detailRequest.current) return;
    if (breakdownError) {
      dispatchTransactionDialogAction({action: 'FETCH_ERROR', error: breakdownError});
      setDetail(<Button onClick={() => void handleClickEntity(row)}>Retry category breakdown</Button>);
      return;
    }
    const {category: selected, parentName, direct, total, children} = breakdown;
    const amount = (key: string, label: string, {income, expenses}: typeof direct) => (
      <Stack key={key} direction={{xs: 'column', sm: 'row'}} sx={{justifyContent: 'space-between', gap: 0.5}}>
        <Typography sx={{overflowWrap: 'anywhere'}}>{label}</Typography>
        <Typography>
          Income: {Formatter.currency.formatBalance(income, currency)} · Expenses:{' '}
          {Formatter.currency.formatBalance(expenses, currency)}
        </Typography>
      </Stack>
    );
    setDetail(
      <Stack spacing={1} sx={{p: 2}}>
        <Typography variant="h6" sx={{overflowWrap: 'anywhere'}}>
          {parentName ? `${parentName} > ${selected.name}` : selected.name} · Breakdown for this month
        </Typography>
        {selected.parentId ? (
          amount('direct', selected.name, direct)
        ) : (
          <>
            {amount('total', 'Total', total)}
            {amount('direct', `Directly booked on ${selected.name}`, direct)}
            {children.map(child => amount(child.category.id, child.category.name, child))}
          </>
        )}
        <Typography variant="subtitle2">Transactions · All dates</Typography>
      </Stack>,
    );
    const [relatedTransactions, error] = await apiClient.backend.transaction.getAll(
      {$categories: [selected.id, ...children.map(child => child.category.id)]},
      {cache: 'no-store'},
    );
    if (request !== detailRequest.current) return;
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
    ++detailRequest.current;
    setDetail(null);
    dispatchTransactionDialogAction({action: 'CLEAR'});
  };

  const handleEditEntity = React.useCallback(
    async (entity: TCategory) => {
      const [parent, error] = entity.parentId
        ? await apiClient.backend.category.getById(entity.parentId)
        : [null, null];
      if (error) {
        showSnackbar({message: error.message});
        return;
      }
      dispatchDrawerAction({
        type: 'OPEN',
        action: 'EDIT',
        defaultValues: {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          parent: parent?.data ?? null,
        },
      });
    },
    [showSnackbar],
  );

  const loadCategoryForIntent = React.useCallback(
    async (id: string) => {
      const existingCategory = categories?.find(category => category.id === id);
      if (existingCategory) return existingCategory;

      const [category, error] = await apiClient.backend.category.getById(id);
      if (error) {
        showSnackbar({message: `Failed to open category: ${error.message}`});
        return null;
      }
      if (!category?.data) {
        showSnackbar({message: 'Category not found'});
        return null;
      }
      return category.data;
    },
    [categories, showSnackbar],
  );

  const handleIntentEdit = React.useCallback(
    async (id: string) => {
      const category = await loadCategoryForIntent(id);
      if (category) handleEditEntity(category);
    },
    [handleEditEntity, loadCategoryForIntent],
  );

  const openDelete = React.useCallback((target: TCategory['id'] | TCategory['id'][]) => {
    setDeletePreview(null);
    setDeletePreviewError(false);
    dispatchDeleteDialogAction({action: 'OPEN', target});
  }, []);

  const handleIntentDelete = React.useCallback((id: string) => openDelete(id as TCategory['id']), [openDelete]);

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

  const handleDeleteEntity = async (entityId: TCategory['id'], childIds: string[]) => {
    const [deletedCategory, error] = await apiClient.backend.category.deleteConfirmed(entityId, {
      confirmedChildIds: childIds,
    });
    if (error || !deletedCategory) {
      return showSnackbar({
        message: `${error.message}. Reopen the confirmation to review the current scope.`,
      });
    }

    showSnackbar({
      message: deletedCategory.message ?? `Category was deleted successfully`,
    });
    dispatch(refresh());
    void loadHierarchy();
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

  const columns: ColumnDefinition<TCategory>[] = [
    {
      key: 'name',
      label: 'Name',
      renderCell: (value, row) => (
        <Typography variant="body1" sx={{pl: row.parentId ? 2 : 0, overflowWrap: 'anywhere'}}>
          {row.parentId ? '↳ ' : ''}
          <Button
            sx={{p: 0, minWidth: 0, textTransform: 'none', textAlign: 'left', overflowWrap: 'anywhere'}}
            aria-label={`View category details for ${row.name}`}
            onClick={() => void handleClickEntity(row)}
          >
            {value as string}
          </Button>
          {row.parentId && (
            <Typography variant="caption" sx={{display: 'block'}}>
              Parent: {hierarchy.find(item => item.id === row.parentId)?.name ?? 'Loading parent'}
            </Typography>
          )}
        </Typography>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      renderCell: value => <Typography variant="body1">{(value as string | null) || 'No description'}</Typography>,
    },
    {
      key: 'id' as keyof TCategory,
      label: '',
      align: 'right',
      renderCell: (_value, row) => (
        <Box sx={{display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap'}}>
          {!row.parentId && (
            <Button
              size="small"
              onClick={event => {
                event.stopPropagation();
                dispatchDrawerAction({type: 'OPEN', action: 'CREATE', defaultValues: {parent: row}});
              }}
            >
              Add child
            </Button>
          )}
          <EntityMenu entity={row} handleEditEntity={handleEditEntity} handleDeleteEntity={({id}) => openDelete(id)} />
        </Box>
      ),
    },
  ];

  const batchColumns = React.useMemo(
    () => categoryBatchColumns({labels: {name: t('name'), description: t('description')}}),
    [t],
  );

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
        label: 'Edit selected',
        onClick: handleEditSelected,
      },
      {
        icon: <MergeIcon fontSize={'small'} />,
        label: 'Merge',
        onClick(categories) {
          const sources = categories.filter(category => !populatedRoots.has(category.id));
          if (!sources.length) {
            showSnackbar({message: 'Categories with children cannot be merge sources.'});
            return;
          }
          if (sources.length !== categories.length)
            showSnackbar({message: 'Categories with children were omitted from the merge sources.'});
          dispatchMergeDrawerAction({
            type: 'OPEN',
            action: 'MERGE',
            defaultValues: {
              sourceCategories: sources,
            },
          });
        },
      },
    ];
  }, [handleEditSelected, populatedRoots, showSnackbar]);

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
          title: t('title'),
          subtitle: t('subtitle'),
          showCount: true,
          showSearch: true,
          searchPlaceholder: t('searchPlaceholder'),
          searchDefaultValue: initialKeyword,
          onSearch: handleTextSearch,
          actions: [
            {
              id: 'create-category',
              icon: <AddIcon />,
              label: 'Create',
              onClick: handleCreateEntity,
            },
            {
              id: 'create-multiple-categories',
              icon: <CreateMultipleIcon />,
              label: 'Create multiple',
              onClick: handleCreateMultiple,
            },
          ],
        }}
        emptyMessage={filters.keyword ? t('noCategoriesFoundFor', {keyword: filters.keyword}) : t('noCategoriesFound')}
        emptyState={
          categories !== null && totalEntityCount === 0 && !hasActiveFilters
            ? {
                variant: 'create',
                title: 'Create your first category',
                description: 'Organize your transactions with categories that match your spending.',
                createLabel: 'Create category',
                onCreate: handleCreateEntity,
              }
            : undefined
        }
        withSelection
        onDeleteSelectedEntities={openDelete}
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
        title={batchDialogState.mode === 'CREATE' ? 'Create categories' : 'Edit categories'}
        mode={batchDialogState.mode}
        initialRows={batchDialogState.initialRows}
        columns={batchColumns}
        createEmptyRow={createEmptyCategoryRow}
        mapRowsToPayload={mapCategoryRowsToPayload}
        onSubmit={handleBatchSubmit}
        onClose={() => setBatchDialogState(current => ({...current, open: false}))}
        isSubmitting={isBatchSubmitting}
      />

      <EntityDrawer<EntityFormFields>
        title={t('category')}
        subtitle={drawerState.action === 'CREATE' ? t('createNewCategory') : t('editCategory')}
        open={drawerState.isOpen}
        onSubmit={handleFormSubmission}
        onClose={closeEntityDrawer}
        closeOnBackdropClick
        onResetForm={() => {
          return {
            id: null,
            name: null,
            description: null,
            parent: drawerState.action === 'CREATE' ? (drawerState.defaultValues?.parent ?? null) : null,
          };
        }}
        defaultValues={drawerState.defaultValues ?? undefined}
        fields={[
          {
            type: 'text',
            name: 'name',
            label: t('name'),
            placeholder: t('name'),
            required: true,
          },
          {
            type: 'text',
            name: 'description',
            label: t('description'),
            placeholder: t('description'),
            area: true,
            rows: 2,
          },
          ...(drawerState.defaultValues?.id && populatedRoots.has(drawerState.defaultValues.id)
            ? []
            : [
                {
                  type: 'autocomplete' as const,
                  name: 'parent' as const,
                  label: 'Parent category',
                  placeholder: 'No parent (root)',
                  keyName: 'id',
                  searchAsYouType: false,
                  retrieveOptionsFunc: () =>
                    hierarchy.filter(row => !row.parentId && row.id !== drawerState.defaultValues?.id),
                  getOptionLabel: (row: unknown) => (row as TCategoryVH).name,
                  isOptionEqualToValue: (left: unknown, right: unknown) =>
                    (left as TCategoryVH).id === (right as TCategoryVH).id,
                },
              ]),
        ]}
      />
      <Dialog
        open={Boolean(pendingMove)}
        onClose={() => {
          if (!savingMove) setPendingMove(null);
        }}
        fullWidth
        maxWidth="xs"
        aria-labelledby="move-category-title"
      >
        <DialogTitle id="move-category-title">Confirm category move</DialogTitle>
        <DialogContent sx={{overflowWrap: 'anywhere'}}>
          <Typography>From: {pendingMove?.before}</Typography>
          <Typography>To: {pendingMove?.after}</Typography>
          <Typography sx={{mt: 2}}>
            Historical reports and affected budgets can change. Transactions and recurring payments keep their assigned
            category.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={savingMove} onClick={() => setPendingMove(null)}>
            Cancel
          </Button>
          <Button
            disabled={savingMove}
            onClick={async () => {
              setSavingMove(true);
              try {
                await pendingMove?.save();
              } finally {
                setSavingMove(false);
              }
            }}
          >
            Confirm move
          </Button>
        </DialogActions>
      </Dialog>
      <MergeCategoriesDialog
        isOpen={mergeDrawerState.isOpen}
        source={mergeDrawerState.defaultValues?.sourceCategories || []}
        onClose={() => {
          dispatchMergeDrawerAction({type: 'CLOSE'});
          void loadHierarchy();
        }}
      />
      <DeleteDialog
        open={deleteDialogState.isOpen}
        confirmDisabled={!deletePreview || deletePreview.target !== deleteDialogState.target}
        text={{
          content: deletePreviewError
            ? 'Could not load the current deletion scope. Close this dialog and try again.'
            : deletePreview
              ? `Categories to delete: ${deletePreview.scopes.flatMap(scope => scope.labels).join(', ')}. This deletes the selected categories and all their children, plus all transactions (including their attachments) and recurring payments assigned to any of them. Their budget links are removed, but the budgets remain.`
              : 'Loading the current deletion scope...',
        }}
        onCancel={() => {
          dispatchDeleteDialogAction({action: 'CLOSE'});
        }}
        onClose={() => {
          dispatchDeleteDialogAction({action: 'CLOSE'});
        }}
        onConfirm={() => {
          if (!deletePreview || deletePreview.target !== deleteDialogState.target) return;
          dispatchDeleteDialogAction({action: 'CLOSE'});
          for (const {id, childIds} of deletePreview.scopes) void handleDeleteEntity(id, childIds);
        }}
      />
      <TransactionDialog {...transactionDialogState} onClose={handleCloseTransactionDialog} summary={detail} />
      <FabContainer>
        <AddFab onClick={handleCreateEntity} label={t('addCategory')} />
      </FabContainer>
    </React.Fragment>
  );
};
