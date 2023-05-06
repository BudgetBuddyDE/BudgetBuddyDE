import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ActionPaper,
  Card,
  CircularProgress,
  CreateFab,
  CreatePaymentMethod,
  EarningsByPaymentMethod,
  EditPaymentMethod,
  FabContainer,
  InitialTablePaginationState,
  Linkify,
  NoResults,
  OpenFilterFab,
  PageHeader,
  SearchInput,
  SelectMultiple,
  TablePagination,
  TablePaginationHandler,
  UsedByPaymentMethod,
} from '../components';
import type { SelectMultipleHandler } from '../components';
import { SnackbarContext, StoreContext } from '../context';
import { useFetchPaymentMethods, useFetchSubscriptions, useFetchTransactions } from '../hooks';
import { PaymentMethod } from '../models';
import { SelectMultipleReducer, TablePaginationReducer, generateInitialState } from '../reducer';
import { PaymentMethodService } from '../services';
import { DescriptionTableCellStyle } from '../theme/description-table-cell.style';

interface PaymentMethodHandler {
  clearLocatioState: () => void;
  onSearch: (keyword: string) => void;
  pagination: TablePaginationHandler;
  paymentMethod: {
    onDelete: (paymentMethod: PaymentMethod) => void;
  };
  selectMultiple: SelectMultipleHandler;
}

export const PaymentMethods = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSnackbar } = React.useContext(SnackbarContext);
  const { setPaymentMethods } = React.useContext(StoreContext);
  const fetchTransactions = useFetchTransactions();
  const fetchSubscriptions = useFetchSubscriptions();
  const fetchPaymentMethods = useFetchPaymentMethods();
  const [, startTransition] = React.useTransition();
  const [showAddForm, setShowAddForm] = React.useState(
    location.state !== null && (location.state as any).create !== undefined && (location.state as any).create === true
  );
  const [keyword, setKeyword] = React.useState('');
  const [editPaymentMethod, setEditPaymentMethod] = React.useState<PaymentMethod | null>(null);
  const [tablePagination, setTablePagination] = React.useReducer(TablePaginationReducer, InitialTablePaginationState);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = React.useReducer(
    SelectMultipleReducer,
    generateInitialState()
  );

  const handler: PaymentMethodHandler = {
    clearLocatioState() {
      window.history.replaceState(null, '');
    },
    onSearch(keyword) {
      setKeyword(keyword.toLowerCase());
    },
    pagination: {
      onPageChange(newPage) {
        setTablePagination({ type: 'CHANGE_PAGE', page: newPage });
      },
      onRowsPerPageChange(rowsPerPage) {
        setTablePagination({ type: 'CHANGE_ROWS_PER_PAGE', rowsPerPage: rowsPerPage });
      },
    },
    paymentMethod: {
      async onDelete(paymentMethod) {
        try {
          const deletedPaymentMethods = await paymentMethod.delete();
          if (!deletedPaymentMethods || deletedPaymentMethods.length < 1) throw new Error('No payment-method deleted');
          startTransition(() => {
            setPaymentMethods({ type: 'REMOVE_BY_ID', id: paymentMethod.id });
          });
          showSnackbar({ message: `Payment Method ${paymentMethod.name} deleted` });
        } catch (error) {
          console.error(error);
          showSnackbar({
            message: `Could'nt delete payment method`,
            action: <Button onClick={() => handler.paymentMethod.onDelete(paymentMethod)}>Retry</Button>,
          });
        }
      },
    },
    selectMultiple: {
      onSelectAll: (event, checked) => {
        startTransition(() => {
          setSelectedPaymentMethods({
            type: 'SET_SELECTED',
            selected:
              selectedPaymentMethods.selected.length > 0 &&
              (selectedPaymentMethods.selected.length < shownPaymentMethods.length ||
                shownPaymentMethods.length === selectedPaymentMethods.selected.length)
                ? []
                : shownPaymentMethods.map(({ id }) => id),
          });
        });
      },
      onSelectSingle: (event, checked) => {
        const item = Number(event.target.value);
        setSelectedPaymentMethods(checked ? { type: 'ADD_ITEM', item: item } : { type: 'REMOVE_ITEM', item: item });
      },
      actionBar: {
        onEdit: () => {
          setSelectedPaymentMethods({ type: 'OPEN_DIALOG', dialog: 'EDIT' });
        },
        onDelete: () => {
          setSelectedPaymentMethods({ type: 'OPEN_DIALOG', dialog: 'DELETE' });
        },
      },
      dialog: {
        onDeleteCancel: () => {
          setSelectedPaymentMethods({ type: 'CLOSE_DIALOG' });
        },
        onDeleteConfirm: async () => {
          try {
            const result = await PaymentMethodService.delete(selectedPaymentMethods.selected);
            setPaymentMethods({ type: 'REMOVE_MULTIPLE_BY_ID', ids: result.map((paymentMethod) => paymentMethod.id) });
            setSelectedPaymentMethods({ type: 'CLOSE_DIALOG_AFTER_DELETE' });
            showSnackbar({ message: 'Payment-methods deleted' });
          } catch (error) {
            console.error(error);
            showSnackbar({
              message: "Couln't delete the payment-methods",
              action: <Button onClick={handler.selectMultiple.dialog.onDeleteConfirm}>Retry</Button>,
            });
            setSelectedPaymentMethods({ type: 'CLOSE_DIALOG' });
          }
        },
      },
    },
  };

  const shownPaymentMethods: PaymentMethod[] = React.useMemo(() => {
    if (keyword === '') return fetchPaymentMethods.paymentMethods;
    return fetchPaymentMethods.paymentMethods.filter(
      (item) => item.name.toLowerCase().includes(keyword) || item.provider.toLowerCase().includes(keyword)
    );
  }, [keyword, fetchPaymentMethods.paymentMethods]);

  const currentPagePaymentMethods: PaymentMethod[] = React.useMemo(() => {
    const { page, rowsPerPage } = tablePagination;
    return shownPaymentMethods.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [shownPaymentMethods, tablePagination]);

  React.useEffect(() => {
    return () => handler.clearLocatioState();
  }, []);

  React.useEffect(() => console.log(location), [location]);

  return (
    <Grid container spacing={3}>
      <PageHeader title="Payment Methods" description="How are u paying today, sir?" />

      <Grid item xs={12} md={9} lg={8} xl={9}>
        <Card sx={{ p: 0 }}>
          <Card.Header sx={{ p: 2, pb: 0 }}>
            <Box>
              <Card.Title>Payment Methods</Card.Title>
              <Card.Subtitle>Manage your payment-methods</Card.Subtitle>
            </Box>
            <Card.HeaderActions sx={{ mt: { xs: 1, md: 0 }, width: { xs: '100%', md: 'unset' } }}>
              <ActionPaper sx={{ display: 'flex', flexDirection: 'row', width: { xs: '100%' } }}>
                <SearchInput onSearch={handler.onSearch} />
                <Tooltip title="Add Payment Method">
                  <IconButton color="primary" onClick={() => setShowAddForm(true)}>
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </ActionPaper>
            </Card.HeaderActions>
          </Card.Header>
          {fetchPaymentMethods.loading ? (
            <CircularProgress />
          ) : fetchPaymentMethods.paymentMethods.length > 0 ? (
            <React.Fragment>
              <Card.Body>
                <SelectMultiple.Actions
                  amount={selectedPaymentMethods.selected.length}
                  onDelete={handler.selectMultiple.actionBar.onDelete}
                />
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="Payment Methods Table">
                    <TableHead>
                      <TableRow>
                        <SelectMultiple.SelectAllCheckbox
                          onChange={handler.selectMultiple.onSelectAll}
                          indeterminate={
                            selectedPaymentMethods.selected.length > 0 &&
                            selectedPaymentMethods.selected.length < shownPaymentMethods.length
                          }
                          checked={
                            selectedPaymentMethods.selected.length === shownPaymentMethods.length &&
                            selectedPaymentMethods.selected.length > 0
                          }
                          withTableCell
                        />

                        {['Name', 'Provider', 'Address', 'Description', ''].map((cell, index) => (
                          <TableCell key={index}>
                            <Typography fontWeight="bolder">{cell}</Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentPagePaymentMethods.map((row) => (
                        <TableRow
                          key={row.id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <TableCell>
                            <SelectMultiple.SelectSingleCheckbox
                              value={row.id}
                              onChange={handler.selectMultiple.onSelectSingle}
                              checked={selectedPaymentMethods.selected.includes(row.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography>{row.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Linkify>{row.provider}</Linkify>
                          </TableCell>
                          <TableCell>
                            <Linkify>{row.address}</Linkify>
                          </TableCell>
                          <TableCell sx={DescriptionTableCellStyle}>
                            <Linkify>{row.description ?? 'No description'}</Linkify>
                          </TableCell>
                          <TableCell align="right">
                            <ActionPaper sx={{ width: 'fit-content', ml: 'auto' }}>
                              <Tooltip title="Edit" placement="top">
                                <IconButton color="primary" onClick={() => setEditPaymentMethod(row)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete" placement="top">
                                <IconButton color="primary" onClick={() => handler.paymentMethod.onDelete(row)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </ActionPaper>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card.Body>
              <Card.Footer sx={{ p: 2, pt: 0 }}>
                <TablePagination
                  {...tablePagination}
                  count={shownPaymentMethods.length}
                  onPageChange={handler.pagination.onPageChange}
                  onRowsPerPageChange={handler.pagination.onRowsPerPageChange}
                />
              </Card.Footer>
            </React.Fragment>
          ) : (
            <NoResults sx={{ m: 2 }} text="No payment-methods found" />
          )}
        </Card>
      </Grid>

      <Grid container item xs={12} md={3} lg={4} xl={3} spacing={3}>
        <Grid item xs={12}>
          {!fetchPaymentMethods.loading && !fetchSubscriptions.loading && !fetchTransactions.loading && (
            <UsedByPaymentMethod
              paymentMethods={fetchPaymentMethods.paymentMethods}
              transactions={fetchTransactions.transactions}
              subscriptions={fetchSubscriptions.subscriptions}
            />
          )}
        </Grid>

        <Grid item xs={12}>
          {!fetchPaymentMethods.loading && !fetchTransactions.loading && (
            <EarningsByPaymentMethod
              paymentMethods={fetchPaymentMethods.paymentMethods}
              transactions={fetchTransactions.transactions}
            />
          )}
        </Grid>
      </Grid>

      <FabContainer>
        <OpenFilterFab />
        <CreateFab onClick={() => setShowAddForm(true)} />
      </FabContainer>
      <SelectMultiple.ConfirmDeleteDialog
        open={selectedPaymentMethods.dialog.show && selectedPaymentMethods.dialog.type === 'DELETE'}
        onCancel={handler.selectMultiple.dialog.onDeleteCancel!}
        onConfirm={handler.selectMultiple.dialog.onDeleteConfirm!}
      />

      <CreatePaymentMethod
        open={showAddForm}
        setOpen={(show) => {
          // If an location.state is set and used to create an payment-method
          // we're gonna clear that state after it got closed (in order to remove the default paymentMethod)
          if (
            !show &&
            location.state !== null &&
            (location.state as any).create === true &&
            (location.state as any).category !== undefined
          ) {
            navigate(location.pathname, { replace: true, state: null });
          }
          setShowAddForm(show);
        }}
        paymentMethod={
          location.state &&
          (location.state as any).create !== undefined &&
          (location.state as any).paymentMethod !== undefined
            ? (location.state as any).paymentMethod
            : undefined
        }
      />

      <EditPaymentMethod
        open={editPaymentMethod !== null}
        setOpen={(show) => {
          if (!show) setEditPaymentMethod(null);
        }}
        paymentMethod={editPaymentMethod}
      />
    </Grid>
  );
};
