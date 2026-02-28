'use client';

import {CreateOrUpdateCategoryPayload, type TCategory} from '@budgetbuddyde/api/category';
import {AddRounded, MergeRounded} from '@mui/icons-material';
import {Button, Typography} from '@mui/material';
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
import {useSnackbarContext} from '@/components/Snackbar';
import {
  type ColumnDefinition,
  EntityMenu,
  type EntitySlice,
  EntityTable,
  type SelectionAction,
} from '@/components/Table';
import {categorySlice} from '@/lib/features/categories/categorySlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {logger} from '@/logger';
import {MergeCategoriesDialog, type MergeCategoriesForm} from '../MergeCategoriesDialog';

type EntityFormFields = FirstLevelNullable<Pick<TCategory, 'id' | 'name' | 'description'>>;

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type CategoryTableProps = {};

export const CategoryTable: React.FC<CategoryTableProps> = () => {
  const {showSnackbar} = useSnackbarContext();
  const {refresh, getPage, setPage, setRowsPerPage, applyFilters} = categorySlice.actions;
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
  const [drawerState, dispatchDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<EntityFormFields>(),
  );
  const [mergeDrawerState, dispatchMergeDrawerAction] = React.useReducer(
    entityDrawerReducer,
    getInitialEntityDrawerState<MergeCategoriesForm, 'MERGE'>(),
  );
  const [deleteDialogState, dispatchDeleteDialogAction] = React.useReducer(
    deleteDialogReducer,
    getInitialDeleteDialogState<TCategory['id']>(),
  );

  const closeEntityDrawer = () => {
    dispatchDrawerAction({type: 'CLOSE'});
  };

  const handleCreateEntity = () => {
    dispatchDrawerAction({type: 'OPEN', action: 'CREATE'});
  };

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (payload, onSuccess) => {
    const action = drawerState.action;
    const parsedPayload = CreateOrUpdateCategoryPayload.safeParse(payload);
    if (!parsedPayload.success) {
      const issues: string = parsedPayload.error.issues.map(issue => issue.message).join(', ');
      showSnackbar({
        message: `Failed to ${action === 'CREATE' ? 'create' : 'update'} category: ${issues}`,
        action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
      });
      return;
    }

    if (action === 'CREATE') {
      const [createdCategory, error] = await apiClient.backend.category.create(parsedPayload.data);
      if (!createdCategory || error) {
        return showSnackbar({
          message: `Failed to create category: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({message: createdCategory.message || 'Category created'});
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    } else if (action === 'EDIT') {
      const entityId = drawerState.defaultValues?.id;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update category: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      const [updatedCategory, error] = await apiClient.backend.category.updateById(entityId, parsedPayload.data);
      if (error) {
        return showSnackbar({
          message: `Failed to update category: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({message: updatedCategory.message || 'Category updated'});
      dispatchDrawerAction({type: 'CLOSE'});
      onSuccess?.();
      dispatch(refresh());
    }
  };

  const handleEditEntity = (entity: TCategory) => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        id: entity.id,
        name: entity.name,
        description: entity.description,
      },
    });
  };

  const handleDeleteEntity = async (entityId: TCategory['id']) => {
    const [deletedCategory, error] = await apiClient.backend.category.deleteById(entityId);
    if (error || !deletedCategory) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entityId)}>Retry</Button>,
      });
    }

    showSnackbar({
      message: deletedCategory.message ?? `Category was deleted successfully`,
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

  const columns: ColumnDefinition<TCategory>[] = React.useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        renderCell: value => <Typography variant="body1">{value as string}</Typography>,
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
    [handleEditEntity],
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

  const selectionActions: SelectionAction<TCategory>[] = React.useMemo(() => {
    return [
      {
        icon: <MergeRounded fontSize={'small'} />,
        label: 'Merge',
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
          title: 'Categories',
          subtitle: 'Manage your categories',
          showCount: true,
          searchPlaceholder: 'Search categories…',
          onSearch: handleTextSearch,
          actions: [
            {
              id: 'create-category',
              icon: <AddRounded />,
              label: 'Create',
              onClick: handleCreateEntity,
            },
          ],
        }}
        emptyMessage={filters.keyword ? `No categories found for "${filters.keyword}"` : 'No categories found'}
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

      <EntityDrawer<EntityFormFields>
        title={'Category'}
        subtitle={drawerState.action === 'CREATE' ? 'Create new category' : 'Edit category'}
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
            label: 'Name',
            placeholder: 'Name',
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
          content: `${!Array.isArray(deleteDialogState.target) ? 'Are you sure you want to delete this category?' : `Are you sure you want to delete these ${deleteDialogState.target.length} categories?`}\nThis will delete all associated transactions and recurring payments as well.`,
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
        <AddFab onClick={handleCreateEntity} label="Add category" />
      </FabContainer>
    </React.Fragment>
  );
};
