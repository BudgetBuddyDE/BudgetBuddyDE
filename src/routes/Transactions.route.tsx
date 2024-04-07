import React from 'react';
import {ActionPaper, Linkify} from '@/components/Base';
import {AddFab, ContentGrid, FabContainer, OpenFilterDrawerFab} from '@/components/Layout';
import {useAuthContext} from '@/components/Auth';
import {withAuthLayout} from '@/components/Auth/Layout';
import {useSnackbarContext} from '@/components/Snackbar';
import {
  CreateTransactionDrawer,
  EditTransactionDrawer,
  TransactionService,
  useFetchTransactions,
} from '@/components/Transaction';
import {Avatar, AvatarGroup, Checkbox, Grid, IconButton, TableCell, TableRow, Typography} from '@mui/material';
import {
  type TCreateTransactionPayload,
  type TUpdateTransactionPayload,
  type TTransaction,
  type TTransactionFile,
} from '@budgetbuddyde/types';
import {DeleteDialog} from '@/components/DeleteDialog.component';
import {SearchInput} from '@/components/Base/Search';
import {AddRounded, DeleteRounded, EditRounded} from '@mui/icons-material';
import {Table} from '@/components/Base/Table';
import {AppConfig} from '@/app.config';
import {format} from 'date-fns';
import {DescriptionTableCellStyle} from '@/style/DescriptionTableCell.style';
import {ToggleFilterDrawerButton, useFilterStore} from '@/components/Filter';
import {filterTransactions} from '@/utils/filter.util';
import {CategoryChip} from '@/components/Category';
import {PaymentMethodChip} from '@/components/PaymentMethod';
import {type ISelectionHandler} from '@/components/Base/Select';
import {CreateEntityDrawerState, useEntityDrawer} from '@/hooks';
import {FileService} from '@/services/File.service';
import {ImageViewDialog} from '@/components/ImageViewDialog.component';

interface ITransactionsHandler {
  onSearch: (keyword: string) => void;
  onTransactionDelete: (transaction: TTransaction) => void;
  onConfirmTransactionDelete: () => void;
  onEditTransaction: (transaction: TUpdateTransactionPayload) => void;
  selection: ISelectionHandler<TTransaction>;
}

export const Transactions = () => {
  const {showSnackbar} = useSnackbarContext();
  const {authOptions} = useAuthContext();
  const {filters} = useFilterStore();
  const {transactions, loading: loadingTransactions, refresh: refreshTransactions} = useFetchTransactions();
  const [showCreateDrawer, dispatchCreateDrawer] = React.useReducer(
    useEntityDrawer<TCreateTransactionPayload>,
    CreateEntityDrawerState<TCreateTransactionPayload>(),
  );
  const [showEditDrawer, dispatchEditDrawer] = React.useReducer(
    useEntityDrawer<TUpdateTransactionPayload>,
    CreateEntityDrawerState<TUpdateTransactionPayload>(),
  );
  const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] = React.useState(false);
  const [deleteTransactions, setDeleteTransactions] = React.useState<TTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = React.useState<TTransaction[]>([]);
  const [keyword, setKeyword] = React.useState('');
  const displayedTransactions: TTransaction[] = React.useMemo(() => {
    return filterTransactions(keyword, filters, transactions);
  }, [transactions, keyword, filters]);

  const [imageDialog, setImageDialog] = React.useState<{
    open: boolean;
    image: TTransactionFile | null;
  }>({open: false, image: null});

  const handler: ITransactionsHandler = {
    onSearch(keyword) {
      setKeyword(keyword.toLowerCase());
    },
    onEditTransaction(transaction) {
      dispatchEditDrawer({type: 'open', payload: transaction});
    },
    async onConfirmTransactionDelete() {
      try {
        if (deleteTransactions.length === 0) return;
        const [deletedItem, error] = await TransactionService.delete(
          deleteTransactions.map(({id}) => ({transactionId: id})),
          authOptions,
        );
        if (error) return showSnackbar({message: error.message});

        if (!deletedItem) {
          return showSnackbar({message: "Couldn't delete the transaction"});
        }

        setShowDeleteTransactionDialog(false);
        setDeleteTransactions([]);
        React.startTransition(() => {
          refreshTransactions();
        });
        showSnackbar({message: `Deleted the transaction`});
        setSelectedTransactions([]);
      } catch (error) {
        console.error(error);
      }
    },
    onTransactionDelete(transaction) {
      setShowDeleteTransactionDialog(true);
      setDeleteTransactions([transaction]);
    },
    selection: {
      onSelectAll(shouldSelectAll) {
        setSelectedTransactions(shouldSelectAll ? displayedTransactions : []);
      },
      onSelect(entity) {
        if (this.isSelected(entity)) {
          setSelectedTransactions(prev => prev.filter(({id}) => id !== entity.id));
        } else setSelectedTransactions(prev => [...prev, entity]);
      },
      isSelected(entity) {
        return selectedTransactions.find(elem => elem.id === entity.id) !== undefined;
      },
      onDeleteMultiple() {
        setShowDeleteTransactionDialog(true);
        setDeleteTransactions(selectedTransactions);
      },
    },
  };

  return (
    <ContentGrid title={'Transactions'}>
      <Grid item xs={12} md={12} lg={12} xl={12}>
        <Table<TTransaction>
          isLoading={loadingTransactions}
          title="Transactions"
          subtitle="Manage your transactions"
          data={displayedTransactions}
          headerCells={[
            'Processed at',
            'Category',
            'Receiver',
            'Amount',
            'Payment Method',
            'Information',
            'Attached Files',
            '',
          ]}
          renderRow={transaction => (
            <TableRow
              key={transaction.id}
              sx={{
                '&:last-child td, &:last-child th': {border: 0},
                whiteSpace: 'nowrap',
              }}>
              <TableCell size={AppConfig.table.cellSize}>
                <Checkbox
                  checked={handler.selection.isSelected(transaction)}
                  onChange={() => handler.selection.onSelect(transaction)}
                />
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Typography fontWeight="bolder">{`${format(
                  new Date(transaction.processedAt),
                  'dd.MM.yy',
                )}`}</Typography>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <CategoryChip category={transaction.category} />
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Linkify>{transaction.receiver}</Linkify>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Typography>
                  {transaction.transferAmount.toLocaleString('de', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </Typography>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <PaymentMethodChip paymentMethod={transaction.paymentMethod} />
              </TableCell>
              <TableCell sx={DescriptionTableCellStyle} size={AppConfig.table.cellSize}>
                <Linkify>{transaction.description ?? 'No information'}</Linkify>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <AvatarGroup max={4} variant="rounded">
                  {transaction.attachedFiles.map(file => (
                    <Avatar
                      key={file.uuid}
                      variant="rounded"
                      alt={file.fileName}
                      src={FileService.getAuthentificatedFileLink(file.location, authOptions)}
                      sx={{
                        backgroundColor: theme => theme.palette.background.default,
                        ':hover': {
                          zIndex: 1,
                          transform: 'scale(1.1)',
                          transition: 'transform 0.2s ease-in-out',
                          cursor: 'pointer',
                        },
                      }}
                      onClick={() =>
                        setImageDialog({
                          open: true,
                          image: {
                            ...file,
                            location: FileService.getAuthentificatedFileLink(file.location, authOptions),
                          },
                        })
                      }
                    />
                  ))}
                </AvatarGroup>
              </TableCell>
              <TableCell align="right" size={AppConfig.table.cellSize}>
                <ActionPaper sx={{width: 'fit-content', ml: 'auto'}}>
                  <IconButton
                    color="primary"
                    onClick={() => handler.onEditTransaction(TransactionService.toUpdatePayload(transaction))}>
                    <EditRounded />
                  </IconButton>
                  <IconButton color="primary" onClick={() => handler.onTransactionDelete(transaction)}>
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

              <IconButton color="primary" onClick={() => dispatchCreateDrawer({type: 'open'})}>
                <AddRounded fontSize="inherit" />
              </IconButton>
            </React.Fragment>
          }
          withSelection
          onSelectAll={handler.selection.onSelectAll}
          amountOfSelectedEntities={selectedTransactions.length}
          onDelete={() => {
            if (handler.selection.onDeleteMultiple) handler.selection.onDeleteMultiple();
          }}
        />
      </Grid>

      <CreateTransactionDrawer {...showCreateDrawer} onClose={() => dispatchCreateDrawer({type: 'close'})} />

      <EditTransactionDrawer {...showEditDrawer} onClose={() => dispatchEditDrawer({type: 'close'})} />

      <DeleteDialog
        open={showDeleteTransactionDialog}
        onClose={() => {
          setShowDeleteTransactionDialog(false);
          setDeleteTransactions([]);
        }}
        onCancel={() => {
          setShowDeleteTransactionDialog(false);
          setDeleteTransactions([]);
        }}
        onConfirm={handler.onConfirmTransactionDelete}
        withTransition
      />

      <FabContainer>
        <OpenFilterDrawerFab />
        <AddFab onClick={() => dispatchCreateDrawer({type: 'open'})} />
      </FabContainer>

      <ImageViewDialog
        dialogProps={{
          open: imageDialog.open,
          onClose: () => setImageDialog({open: false, image: null}),
        }}
        image={imageDialog.image}
        withTransition
      />
    </ContentGrid>
  );
};

export default withAuthLayout(Transactions);
