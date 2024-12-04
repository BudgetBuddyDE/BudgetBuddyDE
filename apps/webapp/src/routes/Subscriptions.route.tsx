import {PocketBaseCollection, type TSubscription} from '@budgetbuddyde/types';
import {AddRounded, DeleteRounded, EditRounded} from '@mui/icons-material';
import {Box, Checkbox, Grid2 as Grid, IconButton, TableCell, TableRow, Typography} from '@mui/material';
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
import {ToggleFilterDrawerButton, useFilterStore} from '@/components/Filter';
import {AddFab, ContentGrid, FabContainer, OpenFilterDrawerFab} from '@/components/Layout';
import {withAuthLayout} from '@/features/Auth';
import {CategoryChip} from '@/features/Category';
import {DeleteDialog} from '@/features/DeleteDialog';
import {PaymentMethodChip} from '@/features/PaymentMethod';
import {useSnackbarContext} from '@/features/Snackbar';
import {
  CreateMultipleSubscriptionsDialog,
  SubscriptionActionMenu,
  SubscriptionDrawer,
  SubscriptionPieChart,
  type TSusbcriptionDrawerValues,
  useSubscriptions,
} from '@/features/Subscription';
import {type TTransactionDrawerValues, TransactionDrawer} from '@/features/Transaction';
import {pb} from '@/pocketbase';
import {DescriptionTableCellStyle} from '@/style/DescriptionTableCell.style';
import {determineNextExecution, determineNextExecutionDate, downloadAsJson, filterSubscriptions} from '@/utils';

interface ISubscriptionsHandler {
  showCreateTransactionDialog: (subscription: TSubscription) => void;
  showCreateSubscriptionDialog: () => void;
  showEditSubscriptionDialog: (subscription: TSubscription) => void;
  onSearch: (keyword: string) => void;
  onSubscriptionDelete: (subscription: TSubscription) => void;
  onConfirmSubscriptionDelete: () => void;
  onToggleExecutionStatus: (subscription: TSubscription) => void;
  selection: ISelectionHandler<TSubscription>;
}

export const Subscriptions = () => {
  const {showSnackbar} = useSnackbarContext();
  const {filters} = useFilterStore();
  const {
    data: subscriptions,
    isLoading: isLoadingSubscriptions,
    refreshData: refreshSubscriptions,
  } = useSubscriptions();
  const [transactionDrawer, dispatchTransactionDrawer] = React.useReducer(
    useEntityDrawer<TTransactionDrawerValues>,
    UseEntityDrawerDefaultState<TTransactionDrawerValues>(),
  );
  const [showCreateMultipleDialog, setShowCreateMultipleDialog] = React.useState(false);
  const [subscriptionDrawer, dispatchSubscriptionDrawer] = React.useReducer(
    useEntityDrawer<TSusbcriptionDrawerValues>,
    UseEntityDrawerDefaultState<TSusbcriptionDrawerValues>(),
  );
  const [showDeleteSubscriptionDialog, setShowDeleteSubscriptionDialog] = React.useState(false);
  const [deleteSubscriptions, setDeleteSubscriptions] = React.useState<TSubscription[]>([]);
  const [selectedSubscriptions, setSelectedSubscriptions] = React.useState<TSubscription[]>([]);
  const [keyword, setKeyword] = React.useState('');

  const displayedSubscriptions: TSubscription[] = React.useMemo(() => {
    return filterSubscriptions(keyword, filters, subscriptions ?? []);
  }, [subscriptions, keyword, filters]);

  const handler: ISubscriptionsHandler = {
    showCreateTransactionDialog(subscription) {
      const {
        execute_at,
        transfer_amount,
        information,
        expand: {category, payment_method},
      } = subscription;
      dispatchTransactionDrawer({
        type: 'OPEN',
        drawerAction: 'CREATE',
        payload: {
          processed_at: determineNextExecutionDate(execute_at),
          category: {label: category.name, id: category.id},
          payment_method: {label: payment_method.name, id: payment_method.id},
          receiver: {label: subscription.receiver, value: subscription.receiver},
          transfer_amount: transfer_amount,
          information,
        },
      });
    },
    showCreateSubscriptionDialog() {
      dispatchSubscriptionDrawer({type: 'OPEN', drawerAction: 'CREATE'});
    },
    showEditSubscriptionDialog(subscription) {
      const {
        id,
        execute_at,
        receiver,
        transfer_amount,
        information,
        paused,
        expand: {category, payment_method},
      } = subscription;
      dispatchSubscriptionDrawer({
        type: 'OPEN',
        drawerAction: 'UPDATE',
        payload: {
          id,
          execute_at: determineNextExecutionDate(execute_at),
          receiver: {label: receiver, value: receiver},
          transfer_amount,
          information,
          category: {label: category.name, id: category.id},
          payment_method: {label: payment_method.name, id: payment_method.id},
          paused,
        },
      });
    },
    onSearch(keyword) {
      setKeyword(keyword.toLowerCase());
    },
    async onConfirmSubscriptionDelete() {
      try {
        if (deleteSubscriptions.length === 0) return;

        const deleteResponses = Promise.allSettled(
          deleteSubscriptions.map(subscription =>
            pb.collection(PocketBaseCollection.SUBSCRIPTION).delete(subscription.id),
          ),
        );
        console.debug('Deleting subscriptions', deleteResponses);

        setShowDeleteSubscriptionDialog(false);
        setDeleteSubscriptions([]);
        React.startTransition(() => {
          refreshSubscriptions();
        });
        showSnackbar({message: `Subscriptions we're deleted`});
        setSelectedSubscriptions([]);
      } catch (error) {
        console.error(error);
      }
    },
    onSubscriptionDelete(subscription) {
      setShowDeleteSubscriptionDialog(true);
      setDeleteSubscriptions([subscription]);
    },
    async onToggleExecutionStatus(subscription) {
      try {
        const record = await pb.collection(PocketBaseCollection.SUBSCRIPTION).update(subscription.id, {
          paused: !subscription.paused,
        });

        console.debug('Updated subscription', record);

        showSnackbar({message: `Subscription #${subscription.id} ${record.paused ? 'paused' : 'resumed'}`});
        React.startTransition(() => {
          refreshSubscriptions();
        });
      } catch (error) {
        console.error(error);
        showSnackbar({
          message: error instanceof Error ? error.message : "Something wen't wrong",
        });
      }
    },
    selection: {
      onSelectAll(shouldSelectAll) {
        setSelectedSubscriptions(shouldSelectAll ? displayedSubscriptions : []);
      },
      onSelect(entity) {
        if (this.isSelected(entity)) {
          setSelectedSubscriptions(prev => prev.filter(({id}) => id !== entity.id));
        } else setSelectedSubscriptions(prev => [...prev, entity]);
      },
      isSelected(entity) {
        return selectedSubscriptions.find(elem => elem.id === entity.id) !== undefined;
      },
      onDeleteMultiple() {
        setShowDeleteSubscriptionDialog(true);
        setDeleteSubscriptions(selectedSubscriptions);
      },
    },
  };

  return (
    <ContentGrid title={'Subscriptions'}>
      <Grid size={{xs: 12}}>
        <Table<TSubscription>
          isLoading={isLoadingSubscriptions}
          title="Subscriptions"
          subtitle="Manage your subscriptions"
          data={displayedSubscriptions}
          headerCells={['Execute at', 'Category', 'Receiver', 'Amount', 'Payment Method', 'Information', '']}
          renderRow={subscription => (
            <TableRow
              key={subscription.id}
              sx={{
                '&:last-child td, &:last-child th': {border: 0},
                whiteSpace: 'nowrap',
              }}>
              <TableCell>
                <Checkbox
                  checked={handler.selection.isSelected(subscription)}
                  onChange={() => handler.selection.onSelect(subscription)}
                />
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Typography
                  fontWeight="bolder"
                  sx={{
                    textDecoration: subscription.paused ? 'line-through' : 'unset',
                  }}>
                  {determineNextExecution(subscription.execute_at)}
                </Typography>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <CategoryChip category={subscription.expand.category} />
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Linkify>{subscription.receiver}</Linkify>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Typography>
                  {subscription.transfer_amount.toLocaleString('de', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </Typography>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <PaymentMethodChip paymentMethod={subscription.expand.payment_method} />
              </TableCell>
              <TableCell sx={DescriptionTableCellStyle} size={AppConfig.table.cellSize}>
                <Linkify>{subscription.information ?? 'No information available'}</Linkify>
              </TableCell>
              <TableCell align="right" size={AppConfig.table.cellSize}>
                <Box sx={{display: 'flex', flexDirection: 'row'}}>
                  <ActionPaper sx={{width: 'fit-content', ml: 'auto'}}>
                    <IconButton color="primary" onClick={() => handler.showEditSubscriptionDialog(subscription)}>
                      <EditRounded />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handler.onSubscriptionDelete(subscription)}>
                      <DeleteRounded />
                    </IconButton>
                  </ActionPaper>

                  <ActionPaper sx={{width: 'max-content', ml: 1}}>
                    <SubscriptionActionMenu
                      subscription={subscription}
                      onCreateTransaction={handler.showCreateTransactionDialog}
                      onToggleExecutionState={handler.onToggleExecutionStatus}
                    />
                  </ActionPaper>
                </Box>
              </TableCell>
            </TableRow>
          )}
          tableActions={
            <React.Fragment>
              <ToggleFilterDrawerButton />

              <SearchInput onSearch={handler.onSearch} />

              <IconButton color="primary" onClick={handler.showCreateSubscriptionDialog}>
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
                      downloadAsJson(subscriptions ?? [], `bb_subscriptions_${format(new Date(), 'yyyy_mm_dd')}`);
                    },
                  },
                ]}
              />
            </React.Fragment>
          }
          withSelection
          onSelectAll={handler.selection.onSelectAll}
          amountOfSelectedEntities={selectedSubscriptions.length}
          onDelete={() => {
            if (handler.selection.onDeleteMultiple) handler.selection.onDeleteMultiple();
          }}
        />
      </Grid>

      <Grid size={{xs: 12, md: 4}}>
        <SubscriptionPieChart />
      </Grid>

      <DeleteDialog
        open={showDeleteSubscriptionDialog}
        onClose={() => {
          setShowDeleteSubscriptionDialog(false);
          setDeleteSubscriptions([]);
        }}
        onCancel={() => {
          setShowDeleteSubscriptionDialog(false);
          setDeleteSubscriptions([]);
        }}
        onConfirm={handler.onConfirmSubscriptionDelete}
        withTransition
      />

      <TransactionDrawer
        {...transactionDrawer}
        onClose={() => dispatchTransactionDrawer({type: 'CLOSE'})}
        closeOnBackdropClick
        closeOnEscape
      />

      <CreateMultipleSubscriptionsDialog
        open={showCreateMultipleDialog}
        onClose={() => setShowCreateMultipleDialog(false)}
      />

      <SubscriptionDrawer
        {...subscriptionDrawer}
        onClose={() => dispatchSubscriptionDrawer({type: 'CLOSE'})}
        closeOnBackdropClick
        closeOnEscape
      />

      <FabContainer>
        <OpenFilterDrawerFab />
        <AddFab onClick={handler.showCreateSubscriptionDialog} />
      </FabContainer>
    </ContentGrid>
  );
};

export default withAuthLayout(Subscriptions);
