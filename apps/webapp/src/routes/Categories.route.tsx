import {type TCategory} from '@budgetbuddyde/types';
import {AddRounded, DeleteRounded, EditRounded} from '@mui/icons-material';
import {Checkbox, Grid2 as Grid, IconButton, TableCell, TableRow} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {AppConfig} from '@/app.config';
import {ActionPaper} from '@/components/Base/ActionPaper';
import {Linkify} from '@/components/Base/Link';
import {Menu} from '@/components/Base/Menu';
import {SearchInput} from '@/components/Base/SearchInput';
import {type ISelectionHandler} from '@/components/Base/SelectAll';
import {Table} from '@/components/Base/Table';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {ToggleFilterDrawerButton} from '@/components/Filter';
import {AddFab, ContentGrid, FabContainer, OpenFilterDrawerFab} from '@/components/Layout';
import {withAuthLayout} from '@/features/Auth';
import {
  CategoryChip,
  CategoryDrawer,
  CategoryExpenseChart,
  CategoryIncomeChart,
  CategoryService,
  CreateMultipleCategoriesDialog,
  type TCategoryDrawerValues,
  useCategories,
} from '@/features/Category';
import {DeleteDialog} from '@/features/DeleteDialog';
import {useSnackbarContext} from '@/features/Snackbar';
import {DescriptionTableCellStyle} from '@/style/DescriptionTableCell.style';
import {downloadAsJson} from '@/utils';

interface ICategoriesHandler {
  showCreateDialog: () => void;
  showEditDialog: (category: TCategory) => void;

  onSearch: (keyword: string) => void;
  onCategoryDelete: (category: TCategory) => void;
  onConfirmCategoryDelete: () => void;
  selection: ISelectionHandler<TCategory>;
}

export const Categories = () => {
  const {data: categories, refreshData: refreshCategories, isLoading: isLoadingCategories} = useCategories();
  const {showSnackbar} = useSnackbarContext();
  const [categoryDrawer, dispatchCategoryDrawer] = React.useReducer(
    useEntityDrawer<TCategoryDrawerValues>,
    UseEntityDrawerDefaultState<TCategoryDrawerValues>(),
  );
  const [showCreateMultipleDialog, setShowCreateMultipleDialog] = React.useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = React.useState(false);
  const [deleteCategories, setDeleteCategories] = React.useState<TCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<TCategory[]>([]);
  const [keyword, setKeyword] = React.useState('');

  const displayedCategories: TCategory[] = React.useMemo(() => {
    if (!categories) return [];
    if (keyword.length == 0) return categories;
    return CategoryService.filter(categories, keyword);
  }, [categories, keyword]);

  const handler: ICategoriesHandler = {
    showCreateDialog() {
      dispatchCategoryDrawer({type: 'OPEN', drawerAction: 'CREATE'});
    },
    showEditDialog(category) {
      const {id, name, description} = category;
      dispatchCategoryDrawer({
        type: 'OPEN',
        drawerAction: 'UPDATE',
        payload: {id, name, description},
      });
    },
    onSearch(keyword) {
      setKeyword(keyword.toLowerCase());
    },
    async onConfirmCategoryDelete() {
      try {
        if (deleteCategories.length === 0) return;

        const deleteResponses = Promise.allSettled(deleteCategories.map(({id}) => CategoryService.deleteCategory(id)));
        console.debug('Deleting categories', deleteResponses);

        setShowDeleteCategoryDialog(false);
        setDeleteCategories([]);
        React.startTransition(() => {
          refreshCategories();
        });
        showSnackbar({message: `Categories we're deleted`});
        setSelectedCategories([]);
      } catch (error) {
        console.error(error);
      }
    },
    onCategoryDelete(category) {
      setShowDeleteCategoryDialog(true);
      setDeleteCategories([category]);
    },
    selection: {
      onSelectAll(shouldSelectAll) {
        setSelectedCategories(shouldSelectAll ? displayedCategories : []);
      },
      onSelect(entity) {
        if (this.isSelected(entity)) {
          setSelectedCategories(prev => prev.filter(({id}) => id !== entity.id));
        } else setSelectedCategories(prev => [...prev, entity]);
      },
      isSelected(entity) {
        return selectedCategories.find(elem => elem.id === entity.id) !== undefined;
      },
      onDeleteMultiple() {
        setShowDeleteCategoryDialog(true);
        setDeleteCategories(selectedCategories);
      },
    },
  };

  return (
    <ContentGrid title={'Categories'}>
      <Grid size={{xs: 12, lg: 8}}>
        <Table<TCategory>
          isLoading={isLoadingCategories}
          title="Categories"
          subtitle="Manage your categories"
          data={displayedCategories}
          headerCells={['Name', 'Description', '']}
          renderRow={category => (
            <TableRow
              key={category.id}
              sx={{
                '&:last-child td, &:last-child th': {border: 0},
                whiteSpace: 'nowrap',
              }}>
              <TableCell>
                <Checkbox
                  checked={handler.selection.isSelected(category)}
                  onChange={() => handler.selection.onSelect(category)}
                />
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <CategoryChip category={category} />
              </TableCell>
              <TableCell sx={DescriptionTableCellStyle} size={AppConfig.table.cellSize}>
                <Linkify>{category.description ?? 'No description available'}</Linkify>
              </TableCell>
              <TableCell align="right" size={AppConfig.table.cellSize}>
                <ActionPaper sx={{width: 'fit-content', ml: 'auto'}}>
                  <IconButton color="primary" onClick={() => handler.showEditDialog(category)}>
                    <EditRounded />
                  </IconButton>
                  <IconButton color="primary" onClick={() => handler.onCategoryDelete(category)}>
                    <DeleteRounded />
                  </IconButton>
                </ActionPaper>
              </TableCell>
            </TableRow>
          )}
          tableActions={
            <React.Fragment>
              <ToggleFilterDrawerButton />

              <SearchInput onSearch={handler.onSearch} />

              <IconButton color="primary" onClick={handler.showCreateDialog}>
                <AddRounded fontSize="inherit" />
              </IconButton>

              <Menu
                useIconButton
                actions={[
                  {
                    children: 'Create multiple',
                    onClick: () => setShowCreateMultipleDialog(true),
                  },
                  {
                    children: 'Export',
                    onClick: () => {
                      if (!categories) {
                        return showSnackbar({message: 'No categories to export'});
                      }
                      downloadAsJson(categories, `bb_categories_${format(new Date(), 'yyyy_mm_dd')}`);
                    },
                  },
                ]}
              />
            </React.Fragment>
          }
          withSelection
          onSelectAll={handler.selection.onSelectAll}
          amountOfSelectedEntities={selectedCategories.length}
          onDelete={() => {
            if (handler.selection.onDeleteMultiple) handler.selection.onDeleteMultiple();
          }}
        />
      </Grid>

      <Grid container size={{xs: 12, lg: 4}} spacing={AppConfig.baseSpacing} sx={{height: 'max-content'}}>
        <Grid size={{xs: 12}}>
          <CategoryExpenseChart />
        </Grid>

        <Grid size={{xs: 12}}>
          <CategoryIncomeChart />
        </Grid>
      </Grid>

      <CategoryDrawer
        {...categoryDrawer}
        onClose={() => dispatchCategoryDrawer({type: 'CLOSE'})}
        closeOnBackdropClick
        closeOnEscape
      />

      <CreateMultipleCategoriesDialog
        open={showCreateMultipleDialog}
        onClose={() => setShowCreateMultipleDialog(false)}
      />

      <DeleteDialog
        open={showDeleteCategoryDialog}
        onClose={() => {
          setShowDeleteCategoryDialog(false);
          setDeleteCategories([]);
        }}
        onCancel={() => {
          setShowDeleteCategoryDialog(false);
          setDeleteCategories([]);
        }}
        onConfirm={() => handler.onConfirmCategoryDelete()}
        withTransition
      />

      <FabContainer>
        <OpenFilterDrawerFab />
        <AddFab onClick={handler.showCreateDialog} />
      </FabContainer>
    </ContentGrid>
  );
};

export default withAuthLayout(Categories);
