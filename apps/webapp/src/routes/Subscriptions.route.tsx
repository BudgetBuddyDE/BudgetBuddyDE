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
import {AddFab, ContentGrid, FabContainer} from '@/components/Layout';
import {withAuthLayout} from '@/features/Auth';
import {CategoryChip} from '@/features/Category';
import {DeleteDialog} from '@/features/DeleteDialog';
import {PaymentMethodChip} from '@/features/PaymentMethod';
import {useSnackbarContext} from '@/features/Snackbar';
import {
  CreateMultipleSubscriptionsDialog,
  SubscriptionActionMenu,
  SubscriptionDrawer,
  SubscriptionService,
  type TSusbcriptionDrawerValues,
  useSubscriptions,
} from '@/features/Subscription';
import {type TTransactionDrawerValues, TransactionDrawer} from '@/features/Transaction';
import {logger} from '@/logger';
import {type TExpandedSubscription} from '@/newTypes';
import {Formatter} from '@/services/Formatter';
import {DescriptionTableCellStyle} from '@/style/DescriptionTableCell.style';
import {downloadAsJson} from '@/utils';

interface ISubscriptionsHandler {
  showCreateTransactionDialog: (subscription: TExpandedSubscription) => void;
  showCreateSubscriptionDialog: () => void;
  showEditSubscriptionDialog: (subscription: TExpandedSubscription) => void;
  onSearch: (keyword: string) => void;
  onSubscriptionDelete: (subscription: TExpandedSubscription) => void;
  onConfirmSubscriptionDelete: () => void;
  onToggleExecutionStatus: (subscription: TExpandedSubscription) => void;
  selection: ISelectionHandler<TExpandedSubscription>;
}

export const Subscriptions = () => {
  const {showSnackbar} = useSnackbarContext();
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
  const [deleteSubscriptions, setDeleteSubscriptions] = React.useState<TExpandedSubscription[]>([]);
  const [selectedSubscriptions, setSelectedSubscriptions] = React.useState<TExpandedSubscription[]>([]);
  const [keyword, setKeyword] = React.useState('');

  const displayedSubscriptions: TExpandedSubscription[] = React.useMemo(() => {
    // FIXME: return filterSubscriptions(keyword, undefined, subscriptions ?? []);
    return subscriptions ?? [];
  }, [subscriptions, keyword]);

  const handler: ISubscriptionsHandler = {
    showCreateTransactionDialog(subscription) {
      const {nextExecution, transferAmount, information, receiver, toCategory, toPaymentMethod} = subscription;
      dispatchTransactionDrawer({
        type: 'OPEN',
        drawerAction: 'CREATE',
        payload: {
          processedAt: nextExecution,
          receiver,
          transferAmount,
          information,
          toCategory_ID: toCategory.ID,
          toPaymentMethod_ID: toPaymentMethod.ID,
          receiverAutocomplete: {label: receiver, value: receiver},
          categoryAutocomplete: {ID: toCategory.ID, name: toCategory.name},
          paymentMethodAutocomplete: {ID: toPaymentMethod.ID, name: toPaymentMethod.name},
        },
      });
    },
    showCreateSubscriptionDialog() {
      dispatchSubscriptionDrawer({type: 'OPEN', drawerAction: 'CREATE'});
    },
    showEditSubscriptionDialog(subscription) {
      const {ID, nextExecution, receiver, transferAmount, information, paused, toCategory, toPaymentMethod} =
        subscription;
      dispatchSubscriptionDrawer({
        type: 'OPEN',
        drawerAction: 'UPDATE',
        payload: {
          ID,
          executeAt: nextExecution,
          receiver: receiver,
          transferAmount,
          information,
          paused,
          toCategory_ID: toCategory.ID,
          toPaymentMethod_ID: toPaymentMethod.ID,
          receiverAutocomplete: {label: receiver, value: receiver},
          categoryAutocomplete: {ID: toCategory.ID, name: toCategory.name},
          paymentMethodAutocomplete: {ID: toPaymentMethod.ID, name: toPaymentMethod.name},
        },
      });
    },
    onSearch(keyword) {
      setKeyword(keyword.toLowerCase());
    },
    async onConfirmSubscriptionDelete() {
      try {
        if (deleteSubscriptions.length === 0) return;

        await Promise.allSettled(deleteSubscriptions.map(({ID}) => SubscriptionService.deleteSubscription(ID)));

        setShowDeleteSubscriptionDialog(false);
        setDeleteSubscriptions([]);
        React.startTransition(() => {
          refreshSubscriptions();
        });
        showSnackbar({message: `Subscriptions we're deleted`});
        setSelectedSubscriptions([]);
      } catch (error) {
        logger.error("Something wen't wrong", error);
      }
    },
    onSubscriptionDelete(subscription) {
      setShowDeleteSubscriptionDialog(true);
      setDeleteSubscriptions([subscription]);
    },
    async onToggleExecutionStatus(subscription) {
      try {
        const result = await SubscriptionService.updateSubscription(subscription.ID, {
          paused: !subscription.paused,
        });
        logger.debug('Toggled the subscription status of subscription %s', result.ID);

        showSnackbar({message: `Subscription #${subscription.ID} ${result.paused ? 'paused' : 'resumed'}`});
        React.startTransition(() => {
          refreshSubscriptions();
        });
      } catch (error) {
        logger.error("Something wen't wrong", error);
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
          setSelectedSubscriptions(prev => prev.filter(({ID}) => ID !== entity.ID));
        } else setSelectedSubscriptions(prev => [...prev, entity]);
      },
      isSelected(entity) {
        return selectedSubscriptions.find(elem => elem.ID === entity.ID) !== undefined;
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
        <Table<TExpandedSubscription>
          isLoading={isLoadingSubscriptions}
          title="Subscriptions"
          subtitle="Manage your subscriptions"
          data={displayedSubscriptions}
          headerCells={['Execute at', 'Category', 'Receiver', 'Amount', 'Payment Method', 'Information', '']}
          renderRow={subscription => (
            <TableRow
              key={subscription.ID}
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
                  {Formatter.formatDate().format(subscription.nextExecution, true)}
                </Typography>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <CategoryChip category={subscription.toCategory} />
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Linkify>{subscription.receiver}</Linkify>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Typography>
                  {subscription.transferAmount.toLocaleString('de', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </Typography>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <PaymentMethodChip paymentMethod={subscription.toPaymentMethod} />
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

      {/* <Grid size={{xs: 12, md: 4}}>
        <SubscriptionPieChart />
      </Grid> */}

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
        <AddFab onClick={handler.showCreateSubscriptionDialog} />
      </FabContainer>
    </ContentGrid>
  );
};

export default withAuthLayout(Subscriptions);
