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
import {
  ActionPaper,
  Card,
  CategoryChip,
  CircularProgress,
  CreateSubscription,
  EarningsByCategory,
  EditSubscription,
  InitialTablePaginationState,
  Linkify,
  NoResults,
  PageHeader,
  PaymentMethodChip,
  SearchInput,
  ShowFilterButton,
  TablePagination,
  TablePaginationHandler,
  UsedByPaymentMethod,
} from '../components';
import { SnackbarContext, StoreContext } from '../context';
import { useFetchCategories, useFetchPaymentMethods, useFetchSubscriptions, useFetchTransactions } from '../hooks';
import { Subscription } from '../models';
import { TablePaginationReducer } from '../reducer';
import { determineNextExecution, filterSubscriptions } from '../utils';

interface SubscriptionsHandler {
  onSearch: (keyword: string) => void;
  pagination: TablePaginationHandler;
  subscription: {
    onDelete: (subscription: Subscription) => void;
    onEdit: (subscription: Subscription) => void;
    onShowAddForm: () => void;
  };
}

export const Subscriptions = () => {
  const { showSnackbar } = React.useContext(SnackbarContext);
  const { filter, setSubscriptions } = React.useContext(StoreContext);
  const fetchTransactions = useFetchTransactions();
  const fetchSubscriptions = useFetchSubscriptions();
  const fetchCategories = useFetchCategories();
  const fetchPaymentMethods = useFetchPaymentMethods();
  const [keyword, setKeyword] = React.useState('');
  const [, startTransition] = React.useTransition();
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editSubscription, setEditSubscription] = React.useState<Subscription | null>(null);
  const [tablePagination, setTablePagination] = React.useReducer(TablePaginationReducer, InitialTablePaginationState);

  const handler: SubscriptionsHandler = {
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
    subscription: {
      async onDelete(subscription) {
        try {
          const deletedSubscriptions = await subscription.delete();
          if (!deletedSubscriptions || deletedSubscriptions.length < 1) throw new Error('No subscription deleted');
          startTransition(() => {
            setSubscriptions({ type: 'REMOVE_BY_ID', id: deletedSubscriptions[0].id });
          });
          showSnackbar({ message: `Subscription ${subscription.receiver} deleted` });
        } catch (error) {
          console.error(error);
          showSnackbar({
            message: `Could'nt delete transaction`,
            action: <Button onClick={() => handler.subscription.onDelete(subscription)}>Retry</Button>,
          });
        }
      },
      onShowAddForm() {
        setShowAddForm(true);
      },
      onEdit(subscription) {
        setEditSubscription(subscription);
      },
    },
  };

  const shownSubscriptions: Subscription[] = React.useMemo(() => {
    return filterSubscriptions(keyword, filter, fetchSubscriptions.subscriptions);
  }, [fetchSubscriptions.subscriptions, keyword, filter]);

  const currentPageSubscriptions: Subscription[] = React.useMemo(() => {
    const { page, rowsPerPage } = tablePagination;
    return shownSubscriptions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [shownSubscriptions, tablePagination]);

  return (
    <Grid container spacing={3}>
      <PageHeader title="Subscriptions" description="You got Disney+?" />

      <Grid item xs={12} md={12}>
        <Card sx={{ p: 0 }}>
          <Card.Header sx={{ p: 2, pb: 0 }}>
            <Box>
              <Card.Title>Subscriptions</Card.Title>
              <Card.Subtitle>Manage your monthly subscriptions</Card.Subtitle>
            </Box>
            <Card.HeaderActions sx={{ mt: { xs: 1, md: 0 }, width: { xs: '100%', md: 'unset' } }}>
              <ActionPaper sx={{ display: 'flex', flexDirection: 'row', width: { xs: '100%' } }}>
                <ShowFilterButton />
                <SearchInput onSearch={handler.onSearch} />
                <Tooltip title="Add Subscription">
                  <IconButton color="primary" onClick={() => handler.subscription.onShowAddForm()}>
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </ActionPaper>
            </Card.HeaderActions>
          </Card.Header>
          {fetchSubscriptions.loading ? (
            <CircularProgress />
          ) : shownSubscriptions.length > 0 ? (
            <React.Fragment>
              <Card.Body>
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="Subscriptions Table">
                    <TableHead>
                      <TableRow>
                        {['Next execution', 'Category', 'Receiver', 'Amount', 'Payment Method', 'Information', ''].map(
                          (cell, index) => (
                            <TableCell key={index}>
                              <Typography fontWeight="bolder">{cell}</Typography>
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentPageSubscriptions.map((row) => (
                        <TableRow
                          key={row.id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight="bolder">{determineNextExecution(row.execute_at)}</Typography>
                          </TableCell>
                          <TableCell>
                            <CategoryChip category={row.categories} />
                          </TableCell>
                          <TableCell>
                            <Linkify>{row.receiver}</Linkify>
                          </TableCell>
                          <TableCell>
                            <Typography>
                              {row.amount.toLocaleString('de', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <PaymentMethodChip paymentMethod={row.paymentMethods} />
                          </TableCell>
                          <TableCell>
                            <Linkify>{row.description || 'No Information'}</Linkify>
                          </TableCell>
                          <TableCell align="right">
                            <ActionPaper sx={{ width: 'fit-content', ml: 'auto' }}>
                              <Tooltip title="Edit" placement="top">
                                <IconButton color="primary" onClick={() => handler.subscription.onEdit(row)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete" placement="top">
                                <IconButton color="primary" onClick={() => handler.subscription.onDelete(row)}>
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
                  count={shownSubscriptions.length}
                  onPageChange={handler.pagination.onPageChange}
                  onRowsPerPageChange={handler.pagination.onRowsPerPageChange}
                />
              </Card.Footer>
            </React.Fragment>
          ) : (
            <NoResults sx={{ m: 2 }} text="No subscriptions found" />
          )}
        </Card>
      </Grid>

      <Grid item xs={12} md={4} lg={4} xl={4}>
        {!fetchCategories.loading && !fetchTransactions.loading && (
          <EarningsByCategory categories={fetchCategories.categories} transactions={fetchTransactions.transactions} />
        )}
      </Grid>

      <Grid item xs={12} md={4} lg={4} xl={4}>
        {!fetchPaymentMethods.loading && !fetchTransactions.loading && !fetchSubscriptions.loading && (
          <UsedByPaymentMethod
            paymentMethods={fetchPaymentMethods.paymentMethods}
            transactions={fetchTransactions.transactions}
            subscriptions={fetchSubscriptions.subscriptions}
          />
        )}
      </Grid>

      <CreateSubscription open={showAddForm} setOpen={(show) => setShowAddForm(show)} />

      <EditSubscription
        open={editSubscription !== null}
        setOpen={(show) => {
          if (!show) setEditSubscription(null);
        }}
        subscription={editSubscription}
      />
    </Grid>
  );
};
