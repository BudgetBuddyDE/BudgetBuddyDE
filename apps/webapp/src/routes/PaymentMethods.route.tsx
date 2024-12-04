import {type TPaymentMethod} from '@budgetbuddyde/types';
import {AddRounded, DeleteRounded, EditRounded} from '@mui/icons-material';
import {Checkbox, Grid2 as Grid, IconButton, TableCell, TableRow, Typography} from '@mui/material';
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
import {DeleteDialog} from '@/features/DeleteDialog';
import {
  PaymentMethodChip,
  PaymentMethodDrawer,
  PaymentMethodService,
  usePaymentMethods,
} from '@/features/PaymentMethod';
import {CreateMultiplePaymentMethodsDialog, type TPaymentMethodDrawerValues} from '@/features/PaymentMethod';
import {useSnackbarContext} from '@/features/Snackbar';
import {DescriptionTableCellStyle} from '@/style/DescriptionTableCell.style';
import {downloadAsJson} from '@/utils';

interface IPaymentMethodsHandler {
  showCreateDialog: () => void;
  showEditDialog: (paymentMethod: TPaymentMethod) => void;
  onSearch: (keyword: string) => void;
  onPaymentMethodDelete: (paymentMethod: TPaymentMethod) => void;
  onConfirmPaymentMethodDelete: () => void;
  selection: ISelectionHandler<TPaymentMethod>;
}

export const PaymentMethods = () => {
  const {
    data: paymentMethods,
    isLoading: loadingPaymentMethods,
    refreshData: refreshPaymentMethods,
  } = usePaymentMethods();
  const {showSnackbar} = useSnackbarContext();
  const [paymentMethodDrawer, dispatchPaymentMethodDrawer] = React.useReducer(
    useEntityDrawer<TPaymentMethodDrawerValues>,
    UseEntityDrawerDefaultState<TPaymentMethodDrawerValues>(),
  );
  const [showCreateMultipleDialog, setShowCreateMultipleDialog] = React.useState(false);
  const [showDeletePaymentMethodDialog, setShowDeletePaymentMethodDialog] = React.useState(false);
  const [deletePaymentMethods, setDeletePaymentMethods] = React.useState<TPaymentMethod[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = React.useState<TPaymentMethod[]>([]);
  const [keyword, setKeyword] = React.useState('');

  const displayedPaymentMethods: TPaymentMethod[] = React.useMemo(() => {
    if (!paymentMethods) return [];
    if (keyword.length == 0) return paymentMethods;
    return PaymentMethodService.filter(paymentMethods, keyword);
  }, [paymentMethods, keyword]);

  const handler: IPaymentMethodsHandler = {
    showCreateDialog() {
      dispatchPaymentMethodDrawer({type: 'OPEN', drawerAction: 'CREATE'});
    },
    showEditDialog(paymentMethod) {
      const {id, name, address, provider, description} = paymentMethod;
      dispatchPaymentMethodDrawer({
        type: 'OPEN',
        drawerAction: 'UPDATE',
        payload: {
          id,
          name,
          address,
          provider,
          description,
        },
      });
    },
    onSearch(keyword) {
      setKeyword(keyword.toLowerCase());
    },
    async onConfirmPaymentMethodDelete() {
      try {
        if (deletePaymentMethods.length === 0) return;

        const deleteResponses = Promise.allSettled(
          deletePaymentMethods.map(({id}) => PaymentMethodService.deletePaymentMethod(id)),
        );
        console.debug('Deleting payment-methods', deleteResponses);

        setShowDeletePaymentMethodDialog(false);
        setDeletePaymentMethods([]);
        React.startTransition(() => {
          refreshPaymentMethods();
        });
        showSnackbar({message: `Payment-methods we're deleted`});
        setSelectedPaymentMethods([]);
      } catch (error) {
        console.error(error);
      }
    },
    onPaymentMethodDelete(paymentMethod) {
      setShowDeletePaymentMethodDialog(true);
      setDeletePaymentMethods([paymentMethod]);
    },
    selection: {
      onSelectAll(shouldSelectAll) {
        setSelectedPaymentMethods(shouldSelectAll ? displayedPaymentMethods : []);
      },
      onSelect(entity) {
        if (this.isSelected(entity)) {
          setSelectedPaymentMethods(prev => prev.filter(({id}) => id !== entity.id));
        } else setSelectedPaymentMethods(prev => [...prev, entity]);
      },
      isSelected(entity) {
        return selectedPaymentMethods.find(elem => elem.id === entity.id) !== undefined;
      },
      onDeleteMultiple() {
        setShowDeletePaymentMethodDialog(true);
        setDeletePaymentMethods(selectedPaymentMethods);
      },
    },
  };

  return (
    <ContentGrid title={'Payment-Methods'}>
      <Grid size={{xs: 12}}>
        <Table<TPaymentMethod>
          isLoading={loadingPaymentMethods}
          title="Payment Methods"
          subtitle="Manage your payment methods"
          data={displayedPaymentMethods}
          headerCells={['Name', 'Address', 'Provider', 'Description', '']}
          renderRow={paymentMethod => (
            <TableRow
              key={paymentMethod.id}
              sx={{
                '&:last-child td, &:last-child th': {border: 0},
                whiteSpace: 'nowrap',
              }}>
              <TableCell>
                <Checkbox
                  checked={handler.selection.isSelected(paymentMethod)}
                  onChange={() => handler.selection.onSelect(paymentMethod)}
                />
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <PaymentMethodChip paymentMethod={paymentMethod} />
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                {/* TODO: Format when is IBAN */}
                <Typography>{paymentMethod.address}</Typography>
              </TableCell>
              <TableCell size={AppConfig.table.cellSize}>
                <Typography>{paymentMethod.provider}</Typography>
              </TableCell>
              <TableCell sx={DescriptionTableCellStyle} size={AppConfig.table.cellSize}>
                <Linkify>{paymentMethod.description ?? 'No Description'}</Linkify>
              </TableCell>
              <TableCell align="right" size={AppConfig.table.cellSize}>
                <ActionPaper sx={{width: 'fit-content', ml: 'auto'}}>
                  <IconButton color="primary" onClick={() => handler.showEditDialog(paymentMethod)}>
                    <EditRounded />
                  </IconButton>
                  <IconButton color="primary" onClick={() => handler.onPaymentMethodDelete(paymentMethod)}>
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
                      if (!paymentMethods) {
                        return showSnackbar({message: 'No payment-methods to export'});
                      }
                      downloadAsJson(paymentMethods, `bb_payment_methods_${format(new Date(), 'yyyy_mm_dd')}`);
                    },
                  },
                ]}
              />
            </React.Fragment>
          }
          withSelection
          onSelectAll={handler.selection.onSelectAll}
          amountOfSelectedEntities={selectedPaymentMethods.length}
          onDelete={() => {
            if (handler.selection.onDeleteMultiple) handler.selection.onDeleteMultiple();
          }}
        />
      </Grid>

      <PaymentMethodDrawer
        {...paymentMethodDrawer}
        onClose={() => dispatchPaymentMethodDrawer({type: 'CLOSE'})}
        closeOnBackdropClick
        closeOnEscape
      />

      <CreateMultiplePaymentMethodsDialog
        open={showCreateMultipleDialog}
        onClose={() => setShowCreateMultipleDialog(false)}
      />

      <DeleteDialog
        open={showDeletePaymentMethodDialog}
        onClose={() => {
          setShowDeletePaymentMethodDialog(false);
          setDeletePaymentMethods([]);
        }}
        onCancel={() => {
          setShowDeletePaymentMethodDialog(false);
          setDeletePaymentMethods([]);
        }}
        onConfirm={() => handler.onConfirmPaymentMethodDelete()}
        withTransition
      />

      <FabContainer>
        <OpenFilterDrawerFab />
        <AddFab onClick={handler.showCreateDialog} />
      </FabContainer>
    </ContentGrid>
  );
};

export default withAuthLayout(PaymentMethods);
