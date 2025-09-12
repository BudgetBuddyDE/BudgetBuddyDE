'use client';

import {
  EntityDrawer,
  type EntityDrawerFormHandler,
  entityDrawerReducer,
  getInitialEntityDrawerState,
} from '@/components/Drawer/EntityDrawer';
import { useSnackbarContext } from '@/components/Snackbar';
import { EntityMenu, EntityTable } from '@/components/Table/EntityTable';
import { categorySlice } from '@/lib/features/categories/categorySlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logger } from '@/logger';
import { CategoryService } from '@/services/Category.service';
import { type TCategory } from '@/types';
import { Button, TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';

type EntityFormFields = Pick<TCategory, 'ID' | 'name' | 'description'>;

export type CategoryTableProps = {};

export const CategoryTable: React.FC<CategoryTableProps> = () => {
  const { showSnackbar } = useSnackbarContext();
  const { refresh, getPage, setPage, setRowsPerPage, applyFilters } = categorySlice.actions;
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
    getInitialEntityDrawerState<EntityFormFields>()
  );

  const closeEntityDrawer = () => {
    dispatchDrawerAction({ type: 'CLOSE' });
  };

  const handleCreateEntity = () => {
    dispatchDrawerAction({ type: 'OPEN', action: 'CREATE' });
  };

  const handleFormSubmission: EntityDrawerFormHandler<EntityFormFields> = async (
    payload,
    onSuccess
  ) => {
    const action = drawerState.action;
    if (action == 'CREATE') {
      const [createdCategory, error] = await CategoryService.createCategory(payload);
      if (error) {
        return showSnackbar({
          message: `Failed to create category: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({ message: `Category '${createdCategory.name}' created successfully` });
      dispatchDrawerAction({ type: 'CLOSE' });
      dispatch(refresh());
    } else if (action == 'EDIT') {
      const entityId = drawerState.defaultValues?.ID;
      if (!entityId) {
        return showSnackbar({
          message: `Failed to update category: Missing entity ID`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      const [updatedCategory, error] = await CategoryService.update(entityId, payload);
      if (error) {
        return showSnackbar({
          message: `Failed to update category: ${error.message}`,
          action: <Button onClick={() => handleFormSubmission(payload, onSuccess)}>Retry</Button>,
        });
      }
      showSnackbar({ message: `Category '${updatedCategory.name}' updated successfully` });
      dispatchDrawerAction({ type: 'CLOSE' });
      dispatch(refresh());
    }
  };

  const handleEditEntity = (entity: TCategory) => {
    dispatchDrawerAction({
      type: 'OPEN',
      action: 'EDIT',
      defaultValues: {
        ID: entity.ID,
        name: entity.name,
        description: entity.description,
      },
    });
  };

  const handleDeleteEntity = async (entity: TCategory) => {
    const [success, error] = await CategoryService.delete(entity.ID);
    if (error || !success) {
      return showSnackbar({
        message: error.message,
        action: <Button onClick={() => handleDeleteEntity(entity)}>Retry</Button>,
      });
    }

    showSnackbar({ message: `Category '${entity.name}' deleted successfully` });
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
      <EntityTable<TCategory>
        title="Categories"
        subtitle={'Manage your categories'}
        error={error}
        slots={{
          title: { showCount: true },
          noResults: {
            text: filters.keyword
              ? `No categories found for "${filters.keyword}"`
              : 'No categories found',
          },
          search: {
            enabled: true,
            placeholder: 'Search categories…',
            onSearch: handleTextSearch,
          },
          create: { enabled: true, onClick: handleCreateEntity },
        }}
        totalEntityCount={totalEntityCount}
        isLoading={status === 'loading'}
        data={categories}
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
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { placeholder: true },
        ]}
        renderRow={(cell, item, data) => {
          const key = cell;
          const rowKey = String(item[key]);
          return (
            <TableRow key={rowKey}>
              <TableCell>
                <Typography variant="body1">{item.name}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body1">{item.description || 'No description'}</Typography>
              </TableCell>
              <TableCell align="right">
                <EntityMenu
                  entity={item}
                  handleEditEntity={handleEditEntity}
                  handleDeleteEntity={handleDeleteEntity}
                />
              </TableCell>
            </TableRow>
          );
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
            ID: '',
            name: '',
            description: '',
          };
        }}
        defaultValues={drawerState.defaultValues ?? undefined}
        fields={[
          { type: 'text', name: 'name', label: 'Name', placeholder: 'Name', required: true },
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
    </React.Fragment>
  );
};
