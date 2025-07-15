import {Grid2 as Grid} from '@mui/material';
import React from 'react';

import {type ISelectionHandler} from '@/components/Base/SelectAll';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {useFilterStore} from '@/components/Filter';
import {ImageViewDialog} from '@/components/ImageViewDialog';
import {AddFab, ContentGrid, FabContainer, OpenFilterDrawerFab} from '@/components/Layout';
import {withAuthLayout} from '@/features/Auth';
import {useCategories} from '@/features/Category';
import {DeleteDialog} from '@/features/DeleteDialog';
import {usePaymentMethods} from '@/features/PaymentMethod';
import {useSnackbarContext} from '@/features/Snackbar';
import {
  CreateMultipleTransactionsDialog,
  type TTransactionDrawerValues,
  TransactionDrawer,
  TransactionService,
  TransactionTable,
  useTransactions,
} from '@/features/Transaction';
import {logger} from '@/logger';
import {type TTransaction} from '@/newTypes';

interface ITransactionsHandler {
  showCreateDialog: () => void;
  showEditDialog: (transaction: TTransaction) => void;
  showCreateMultipleDialog: (showDialog: boolean) => void;
  onSearch: (keyword: string) => void;
  onTransactionDelete: (transaction: TTransaction) => void;
  onConfirmTransactionDelete: () => void;
  selection: ISelectionHandler<TTransaction>;
}

export const Transactions = () => {
  const {showSnackbar} = useSnackbarContext();
  const {filters} = useFilterStore();
  const {isLoading: isLoadingCategories, data: categories} = useCategories();
  const {isLoading: isLoadingPaymentMethods, data: paymentMethods} = usePaymentMethods();
  const {isLoading: isLoadingTransactions, data: transactions, refreshData: refreshTransactions} = useTransactions();
  const [transactionDrawer, dispatchTransactionDrawer] = React.useReducer(
    useEntityDrawer<TTransactionDrawerValues>,
    UseEntityDrawerDefaultState<TTransactionDrawerValues>(),
  );
  const [showCreateMultipleDialog, setShowCreateMultipleDialog] = React.useState(false);
  const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] = React.useState(false);
  const [deleteTransactions, setDeleteTransactions] = React.useState<TTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = React.useState<TTransaction[]>([]);
  const [keyword, setKeyword] = React.useState('');
  const displayedTransactions: TTransaction[] = React.useMemo(() => {
    if (!transactions) return [];
    // return filterTransactions(keyword, filters, transactions);
    return transactions;
  }, [transactions, keyword, filters]);
  const [imageDialog, setImageDialog] = React.useState<{
    open: boolean;
    fileName: string | null;
    fileUrl: string | null;
  }>({open: false, fileName: null, fileUrl: null});

  const handler: ITransactionsHandler = {
    showCreateDialog() {
      dispatchTransactionDrawer({type: 'OPEN', drawerAction: 'CREATE'});
    },
    showCreateMultipleDialog(showDialog) {
      setShowCreateMultipleDialog(showDialog);
    },
    showEditDialog({ID, processedAt, receiver, transferAmount, information, toCategory_ID, toPaymentMethod_ID}) {
      // FIXME: This is a workaround to get the category and payment method names
      const category = categories?.find(({ID}) => ID === toCategory_ID);
      const payment_method = paymentMethods?.find(({ID}) => ID === toPaymentMethod_ID);
      dispatchTransactionDrawer({
        type: 'OPEN',
        drawerAction: 'UPDATE',
        payload: {
          ID,
          processedAt,
          receiverOption: {value: receiver, label: receiver},
          transferAmount,
          information: information ?? '',
          toCategory_ID: toCategory_ID,
          toPaymentMethod_ID: toPaymentMethod_ID,
          categoryOption: {name: category!.name, ID: toCategory_ID},
          paymentMethodOption: {name: payment_method!.name, ID: toPaymentMethod_ID},
        },
      });
    },
    onSearch(keyword) {
      setKeyword(keyword.toLowerCase());
    },
    async onConfirmTransactionDelete() {
      try {
        if (deleteTransactions.length === 0) return;

        await Promise.allSettled(deleteTransactions.map(({ID}) => TransactionService.deleteTransaction(ID)));

        setShowDeleteTransactionDialog(false);
        setDeleteTransactions([]);
        React.startTransition(() => {
          refreshTransactions();
        });
        showSnackbar({message: `Transactions we're deleted`});
        setSelectedTransactions([]);
      } catch (error) {
        logger.error("Something wen't wrong", error);
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
        if (handler.selection.isSelected(entity)) {
          setSelectedTransactions(prev => prev.filter(({ID}) => ID !== entity.ID));
        } else setSelectedTransactions(prev => [...prev, entity]);
      },
      isSelected(entity) {
        return selectedTransactions.find(elem => elem.ID === entity.ID) !== undefined;
      },
      onDeleteMultiple() {
        setShowDeleteTransactionDialog(true);
        setDeleteTransactions(selectedTransactions);
      },
    },
  };

  return (
    <ContentGrid title={'Transactions'}>
      <Grid size={{xs: 12}}>
        <TransactionTable
          isLoading={isLoadingTransactions || isLoadingCategories || isLoadingPaymentMethods}
          onAddTransaction={handler.showCreateDialog}
          onAddMultiple={() => handler.showCreateMultipleDialog(true)}
          onEditTransaction={handler.showEditDialog}
          onDeleteTransaction={handler.onTransactionDelete}
          onOpenImage={(fileName, fileUrl) => setImageDialog({open: true, fileName, fileUrl})}
          amountOfSelectedEntities={selectedTransactions.length}
          isSelected={handler.selection.isSelected}
          onSelectAll={handler.selection.onSelectAll}
          onSelect={handler.selection.onSelect}
          onDelete={handler.selection.onDeleteMultiple}
        />
      </Grid>

      <TransactionDrawer
        {...transactionDrawer}
        onClose={() => dispatchTransactionDrawer({type: 'CLOSE'})}
        closeOnBackdropClick
        closeOnEscape
      />

      <CreateMultipleTransactionsDialog
        open={showCreateMultipleDialog}
        onClose={() => handler.showCreateMultipleDialog(false)}
      />

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

      <ImageViewDialog
        dialogProps={{
          open: imageDialog.open,
          onClose: () => setImageDialog({open: false, fileName: null, fileUrl: null}),
        }}
        fileName={imageDialog.fileName ?? ''}
        fileUrl={imageDialog.fileUrl ?? ''}
        withTransition
      />

      <FabContainer>
        <OpenFilterDrawerFab />
        <AddFab onClick={handler.showCreateDialog} />
      </FabContainer>
    </ContentGrid>
  );
};

export default withAuthLayout(Transactions);
