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
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import {
  ActionPaper,
  Card,
  CategoryChip,
  CircularProgress,
  CreateTransaction,
  EditTransaction,
  Linkify,
  NoResults,
  PageHeader,
  PaymentMethodChip,
  SearchInput,
  ShowFilterButton,
} from '../components';
import { SnackbarContext, StoreContext } from '../context';
import { useStateCallback } from '../hooks';
import { Transaction } from '../models';
import { filterTransactions } from '../utils';

export const Transactions = () => {
  const { showSnackbar } = React.useContext(SnackbarContext);
  const { loading, filter, transactions, setTransactions } = React.useContext(StoreContext);
  const rowsPerPageOptions = [10, 25, 50, 100];
  const [keyword, setKeyword] = React.useState('');
  const [shownTransactions, setShownTransactions] =
    useStateCallback<readonly Transaction[]>(transactions);
  const [page, setPage] = React.useState(0);
  const [, startTransition] = React.useTransition();
  const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageOptions[0]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editTransaction, setEditTransaction] = React.useState<Transaction | null>(null);

  const handler: {
    onSearch: (text: string) => void;
    onAddTransaction: (show: boolean) => void;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onTransactionDelete: (transaction: Transaction) => void;
  } = {
    onSearch(text) {
      setKeyword(text.toLowerCase());
    },
    onAddTransaction(show) {
      setShowAddForm(show);
    },
    onPageChange(_event, newPage) {
      setPage(newPage);
    },
    onRowsPerPageChange(event) {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    async onTransactionDelete(transaction) {
      try {
        const deletedTransactions = await transaction.delete();
        if (!deletedTransactions || deletedTransactions.length < 0)
          throw new Error('No transaction deleted');
        startTransition(() => {
          setTransactions((prev) => prev.filter(({ id }) => id !== transaction.id));
        });
        showSnackbar({ message: `Transaction ${transaction.receiver} deleted` });
      } catch (error) {
        console.error(error);
        showSnackbar({
          message: `Could'nt delete transaction`,
          action: <Button onClick={() => handler.onTransactionDelete(transaction)}>Retry</Button>,
        });
      }
    },
  };

  const currentPageTransactions: Transaction[] = React.useMemo(() => {
    return shownTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [shownTransactions, page, rowsPerPage]);

  React.useEffect(() => {
    setShownTransactions(transactions);
  }, [transactions, setShownTransactions]);

  React.useEffect(() => {
    setShownTransactions(filterTransactions(keyword, filter, transactions));
  }, [keyword, filter, transactions, setShownTransactions]);

  return (
    <Grid container spacing={3}>
      <PageHeader title="Transactions" description="What have you bought today?" />

      <Grid item xs={12} md={12}>
        <Card>
          <Card.Header>
            <Box>
              <Card.Title>Transactions</Card.Title>
              <Card.Subtitle>Manage your transactions</Card.Subtitle>
            </Box>
            <Card.HeaderActions sx={{ mt: { xs: 1, md: 0 } }}>
              <ActionPaper sx={{ display: 'flex', flexDirection: 'row' }}>
                <ShowFilterButton />
                <SearchInput onSearch={handler.onSearch} />
                <Tooltip title="Add Transaction">
                  <IconButton color="primary" onClick={() => handler.onAddTransaction(true)}>
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </ActionPaper>
            </Card.HeaderActions>
          </Card.Header>
          {loading ? (
            <CircularProgress />
          ) : transactions.length > 0 ? (
            <>
              <Card.Body>
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="Transaction Table">
                    <TableHead>
                      <TableRow>
                        {[
                          'Date',
                          'Category',
                          'Receiver',
                          'Amount',
                          'Payment Method',
                          'Information',
                          '',
                        ].map((cell, index) => (
                          <TableCell key={index}>
                            <Typography fontWeight="bolder">{cell}</Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentPageTransactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight="bolder">{`${format(
                              new Date(transaction.date),
                              'dd.MM.yy'
                            )}`}</Typography>
                          </TableCell>
                          <TableCell>
                            <CategoryChip category={transaction.categories} />
                          </TableCell>
                          <TableCell>
                            <Linkify>{transaction.receiver}</Linkify>
                          </TableCell>
                          <TableCell>
                            <Typography>
                              {transaction.amount.toLocaleString('de', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <PaymentMethodChip paymentMethod={transaction.paymentMethods} />
                          </TableCell>
                          <TableCell>
                            <Linkify>{transaction.description ?? 'No information'}</Linkify>
                          </TableCell>
                          <TableCell align="right">
                            <ActionPaper sx={{ width: 'fit-content', ml: 'auto' }}>
                              <Tooltip title="Edit" placement="top">
                                <IconButton
                                  color="primary"
                                  onClick={() => setEditTransaction(transaction)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete" placement="top">
                                <IconButton
                                  color="primary"
                                  onClick={() => handler.onTransactionDelete(transaction)}
                                >
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
              <Card.Footer>
                <ActionPaper sx={{ width: 'fit-content', ml: 'auto' }}>
                  <TablePagination
                    component="div"
                    count={shownTransactions.length}
                    page={page}
                    onPageChange={handler.onPageChange}
                    labelRowsPerPage="Rows:"
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handler.onRowsPerPageChange}
                  />
                </ActionPaper>
              </Card.Footer>
            </>
          ) : (
            <NoResults sx={{ mt: 2 }} text="No transactions found" />
          )}
        </Card>
      </Grid>

      <CreateTransaction open={showAddForm} setOpen={(show) => setShowAddForm(show)} />

      <EditTransaction
        open={editTransaction !== null}
        setOpen={(show) => {
          if (!show) setEditTransaction(null);
        }}
        transaction={editTransaction}
      />
    </Grid>
  );
};
