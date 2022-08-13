import { ChangeEvent, useContext, useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Box,
  Tooltip,
  IconButton,
  TextField,
  Alert,
  Button,
  InputAdornment,
  Autocomplete,
  FormControl,
  InputLabel,
  OutlinedInput,
  AlertTitle,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material';
import { LocalizationProvider, DesktopDatePicker, MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Receipt as ReceiptIcon,
  Payments as PaymentsIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { PageHeader } from '../components/page-header.component';
import { AuthContext } from '../context/auth.context';
import { Stats, StatsProps, StatsIconStyle } from '../components/stats-card.component';
import { Transaction } from '../components/transaction.component';
import Card from '../components/card.component';
import { PieChart } from '../components/spendings-chart.component';
import type { IExpense, ISubscription, ITransaction } from '../types/transaction.interface';
import { FormDrawer } from '../components/form-drawer.component';
import { DateService } from '../services/date.service';
import { determineNextExecution } from '../routes/subscriptions.route';
import { supabase } from '../supabase';
import { CircularProgress } from '../components/progress.component';
import { isSameMonth } from 'date-fns/esm';
import { SnackbarContext } from '../context/snackbar.context';
import { useScreenSize } from '../hooks/useScreenSize.hook';
import { StoreContext } from '../context/store.context';

const FormStyle: SxProps<Theme> = {
  width: '100%',
  mb: 2,
};

export const Dashboard = () => {
  const { session } = useContext(AuthContext);
  const {
    loading,
    setLoading,
    subscriptions,
    setSubscriptions,
    transactions,
    setTransactions,
    categories,
    paymentMethods,
  } = useContext(StoreContext);
  const { showSnackbar } = useContext(SnackbarContext);
  const screenSize = useScreenSize();
  const [chart, setChart] = useState<'MONTH' | 'ALL'>('MONTH');
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState<IExpense[]>([]);
  const [allTimeExpenses, setAllTimeExpenses] = useState<IExpense[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [addTransactionForm, setAddTransactionForm] = useState<
    Record<string, string | number | Date>
  >({});
  const [addSubscriptionForm, setAddSubscriptionForm] = useState<
    Record<string, string | number | Date>
  >({});
  const [showAddTransactionForm, setShowAddTransactionForm] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);

  const addTransactionFormHandler = {
    open: () => {
      setShowAddTransactionForm(true);
    },
    close: () => {
      setShowAddTransactionForm(false);
      setAddTransactionForm({});
      setErrorMessage('');
    },
    dateChange: (date: Date | null) => {
      setAddTransactionForm((prev) => ({ ...prev, date: date || new Date() }));
    },
    autocompleteChange: (
      event: React.SyntheticEvent<Element, Event>,
      key: 'category' | 'paymentMethod',
      value: string | number
    ) => {
      setAddTransactionForm((prev) => ({ ...prev, [key]: value }));
    },
    inputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setAddTransactionForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    },
    save: async () => {
      try {
        const values = Object.keys(addTransactionForm);
        if (!values.includes('category')) throw new Error('Provide an category');
        if (!values.includes('paymentMethod')) throw new Error('Provide an paymentMethod');
        if (!values.includes('receiver')) throw new Error('Provide an receiver');
        if (!values.includes('amount')) throw new Error('Provide an amount');

        const { data, error } = await supabase.from('transactions').insert({
          date: addTransactionForm.date || new Date(),
          category: addTransactionForm.category,
          paymentMethod: addTransactionForm.paymentMethod,
          receiver: addTransactionForm.receiver,
          amount:
            typeof addTransactionForm.amount === 'string'
              ? Number(addTransactionForm.amount)
              : addTransactionForm.amount,
          description: addTransactionForm.information || null,
          // @ts-ignore
          created_by: session?.user?.id,
        });
        if (error) throw error;

        setTransactions((prev) => [
          {
            ...data[0],
            categories: categories.find((value) => value.id === data[0].category),
            paymentMethods: paymentMethods.find((value) => value.id === data[0].paymentMethod),
          } as ITransaction,
          ...prev,
        ]);
        addTransactionFormHandler.close();
        showSnackbar({
          message: 'Transaction added',
        });
      } catch (error) {
        console.error(error);
        // @ts-ignore
        setErrorMessage(error.message || 'Unkown error');
      }
    },
  };

  const addSubscriptionFormHandler = {
    open: () => setShowSubscriptionForm(true),
    close: () => {
      setShowSubscriptionForm(false);
      setAddSubscriptionForm({});
      setErrorMessage('');
    },
    dateChange: (date: Date | null) => {
      setAddSubscriptionForm((prev) => ({ ...prev, execute_at: date || new Date() }));
    },
    autocompleteChange: (
      event: React.SyntheticEvent<Element, Event>,
      key: 'category' | 'paymentMethod',
      value: string | number
    ) => {
      setAddSubscriptionForm((prev) => ({ ...prev, [key]: value }));
    },
    inputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setAddSubscriptionForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    },
    save: async () => {
      try {
        const values = Object.keys(addSubscriptionForm);
        if (!values.includes('category')) throw new Error('Provide an category');
        if (!values.includes('paymentMethod')) throw new Error('Provide an payment method');
        if (!values.includes('receiver')) throw new Error('Provide an receiver');
        if (!values.includes('amount')) throw new Error('Provide an receiver');

        const { data, error } = await supabase.from('subscriptions').insert([
          {
            // @ts-ignore
            execute_at: addSubscriptionForm.execute_at.getDate() || new Date().getDate(),
            category: addSubscriptionForm.category,
            paymentMethod: addSubscriptionForm.paymentMethod,
            receiver: addSubscriptionForm.receiver,
            amount: Number(addSubscriptionForm.amount),
            description: addSubscriptionForm.information || null,
            // @ts-ignore
            created_by: session?.user?.id,
          },
        ]);
        if (error) throw error;

        setSubscriptions((prev) => [
          ...prev,
          {
            ...data[0],
            categories: categories.find((value) => value.id === data[0].category),
            paymentMethods: paymentMethods.find((value) => value.id === data[0].paymentMethod),
          } as ISubscription,
        ]);
        addSubscriptionFormHandler.close();
        showSnackbar({
          message: 'Subscription added',
        });
      } catch (error) {
        console.error(error);
        // @ts-ignore
        setErrorMessage(error.message || 'Unkown error');
      }
    },
  };

  const StatsCards: StatsProps[] = [
    {
      title: useMemo(
        () =>
          Math.abs(
            subscriptions
              .filter(
                (subscription) =>
                  subscription.amount < 0 && subscription.execute_at <= new Date().getDate()
              )
              .reduce((prev, cur) => prev + cur.amount, 0)
          ).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
        [subscriptions]
      ),
      subtitle: 'Payed Subscriptions',
      icon: <ReceiptIcon sx={StatsIconStyle} />,
    },
    {
      title: useMemo(
        () =>
          Math.abs(
            subscriptions
              .filter(
                (subscription) =>
                  subscription.amount < 0 && subscription.execute_at > new Date().getDate()
              )
              .reduce((prev, cur) => prev + cur.amount, 0)
          ),
        [subscriptions]
      ).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
      subtitle: 'Upcoming Payments',
      icon: <PaymentsIcon sx={StatsIconStyle} />,
    },
    {
      title: useMemo(
        () =>
          Math.abs(
            subscriptions
              .filter(
                (subscription) =>
                  subscription.amount > 0 && subscription.execute_at > new Date().getDate()
              )
              .reduce((prev, cur) => prev + cur.amount, 0)
          ),
        [subscriptions]
      ).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
      subtitle: 'Upcoming Earnings',
      icon: <ScheduleIcon sx={StatsIconStyle} />,
    },
    {
      title: useMemo(
        () =>
          Math.abs(
            transactions
              .filter(
                (transaction) =>
                  transaction.amount > 0 && isSameMonth(new Date(transaction.date), new Date())
              )
              .reduce((prev, cur) => prev + cur.amount, 0)
          ),
        [transactions]
      ).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
      subtitle: 'Received Earnings',
    },
  ];

  useEffect(() => {
    setLoading(false);
    Promise.all([
      supabase
        .from<IExpense>('CurrentMonthExpenses')
        .select('*')
        // @ts-ignore
        .eq('created_by', session?.user?.id),
      supabase
        .from<IExpense>('AllTimeExpenses')
        .select('*')
        // @ts-ignore
        .eq('created_by', session?.user?.id),
    ])
      .then(([getCurrentMonthExpenses, getAllTimeExpenses]) => {
        if (getCurrentMonthExpenses.data) {
          setCurrentMonthExpenses(getCurrentMonthExpenses.data);
        } else setCurrentMonthExpenses([]);

        if (getAllTimeExpenses.data) {
          setAllTimeExpenses(getAllTimeExpenses.data);
        } else setAllTimeExpenses([]);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  return (
    <Grid container spacing={3}>
      <PageHeader
        title={`Welcome, ${
          (session && session.user && session.user.email && session.user.email.split('@')[0]) ||
          'Username'
        }!`}
        description="All in one page"
      />

      {StatsCards.map((props) => (
        <Grid item xs={6} md={6} lg={3}>
          <Stats {...props} />
        </Grid>
      ))}

      <Grid item xs={12} md={6} lg={4} order={{ xs: 3, md: 1 }}>
        <Card>
          <Card.Header>
            <div>
              <Card.Title>Subscriptions</Card.Title>
              <Card.Subtitle>Your upcoming subscriptions</Card.Subtitle>
            </div>
            <Card.HeaderActions>
              <Tooltip title="Add Subscription">
                <IconButton aria-label="add-subscription">
                  <AddIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Card.HeaderActions>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <CircularProgress />
            ) : (
              subscriptions
                .slice(0, 6)
                .map(({ id, categories, receiver, amount, execute_at }) => (
                  <Transaction
                    key={id}
                    category={categories.name}
                    date={determineNextExecution(execute_at)}
                    receiver={receiver}
                    amount={amount}
                  />
                ))
            )}
          </Card.Body>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4} order={{ xs: 1, md: 2 }}>
        <Card>
          <Card.Header>
            <div>
              <Card.Title>Spendings</Card.Title>
              <Card.Subtitle>Categorized Spendings</Card.Subtitle>
            </div>
            <Card.HeaderActions>
              {[
                {
                  type: 'MONTH',
                  text: DateService.shortMonthName() + '.',
                  tooltip: DateService.getMonthFromDate(),
                  onClick: () => setChart('MONTH'),
                },
                { type: 'ALL', text: 'All', tooltip: 'All-Time', onClick: () => setChart('ALL') },
              ].map((button) => (
                <Tooltip key={button.text} title={button.tooltip}>
                  <Button
                    sx={{
                      color: (theme) => theme.palette.text.primary,
                      px: 1,
                      minWidth: 'unset',
                      backgroundColor: (theme) =>
                        chart === button.type ? theme.palette.action.focus : 'unset',
                    }}
                    onClick={button.onClick}
                  >
                    {button.text}
                  </Button>
                </Tooltip>
              ))}
            </Card.HeaderActions>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <CircularProgress />
            ) : (
              <Box sx={{ display: 'flex', flex: 1, mt: '1rem' }}>
                {chart === 'MONTH' ? (
                  <PieChart expenses={currentMonthExpenses} />
                ) : (
                  <PieChart expenses={allTimeExpenses} />
                )}
              </Box>
            )}
          </Card.Body>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4} order={{ xs: 2, md: 3 }}>
        <Card>
          <Card.Header>
            <div>
              <Card.Title>Transactions</Card.Title>
              <Card.Subtitle>Your latest transactions</Card.Subtitle>
            </div>
            <Card.HeaderActions>
              <Tooltip title="Add Transaction">
                <IconButton aria-label="add-transaction" onClick={addTransactionFormHandler.open}>
                  <AddIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Card.HeaderActions>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <CircularProgress />
            ) : (
              transactions
                .filter(({ date }) => new Date(date) <= new Date())
                .slice(0, 6)
                .map(({ id, categories, receiver, amount, date }, index) => (
                  <Transaction
                    key={id}
                    category={categories.name}
                    date={new Date(date)}
                    receiver={receiver}
                    amount={amount}
                  />
                ))
            )}
          </Card.Body>
        </Card>
      </Grid>

      {/* Add Transaction */}
      <FormDrawer
        open={showAddTransactionForm}
        heading="Add Transaction"
        onClose={addTransactionFormHandler.close}
        onSave={addTransactionFormHandler.save}
      >
        {errorMessage.length > 1 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {categories.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Info</AlertTitle>
            To be able to create a transaction you have to create a category under{' '}
            <strong>Categories {'>'} Add Category</strong> before.{' '}
          </Alert>
        )}

        {paymentMethods.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Info</AlertTitle>
            To be able to create a transaction you have to create a payment method under{' '}
            <strong>Payment Methods {'>'} Add Payment Method</strong> before.{' '}
          </Alert>
        )}

        {!loading && categories.length > 0 && paymentMethods.length > 0 && (
          <form>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {screenSize === 'small' ? (
                <MobileDatePicker
                  label="Date"
                  inputFormat="dd.MM.yy"
                  value={addTransactionForm.date || new Date()}
                  onChange={addTransactionFormHandler.dateChange}
                  renderInput={(params) => <TextField sx={FormStyle} {...params} />}
                />
              ) : (
                <DesktopDatePicker
                  label="Date"
                  inputFormat="dd.MM.yy"
                  value={addTransactionForm.date || new Date()}
                  onChange={addTransactionFormHandler.dateChange}
                  renderInput={(params) => <TextField sx={FormStyle} {...params} />}
                />
              )}
            </LocalizationProvider>

            <Box display="flex" flexDirection="row" justifyContent="space-between">
              <Autocomplete
                id="add-category"
                options={categories.map((item) => ({ label: item.name, value: item.id }))}
                sx={{ width: 'calc(50% - .5rem)', mb: 2 }}
                onChange={(event, value) =>
                  addTransactionFormHandler.autocompleteChange(
                    event,
                    'category',
                    Number(value?.value)
                  )
                }
                renderInput={(props) => <TextField {...props} label="Category" />}
                isOptionEqualToValue={(option, value) => option.value === value.value}
              />
              <Autocomplete
                id="add-payment-method"
                options={paymentMethods.map((item) => ({
                  label: `${item.name} • ${item.provider}`,
                  value: item.id,
                }))}
                sx={{ width: 'calc(50% - .5rem)', mb: 2 }}
                onChange={(event, value) =>
                  addTransactionFormHandler.autocompleteChange(
                    event,
                    'paymentMethod',
                    Number(value?.value)
                  )
                }
                renderInput={(props) => <TextField {...props} label="Payment Method" />}
                isOptionEqualToValue={(option, value) => option.value === value.value}
              />
            </Box>

            <TextField
              id="add-receiver"
              variant="outlined"
              label="Receiver"
              name="receiver"
              sx={FormStyle}
              onChange={addTransactionFormHandler.inputChange}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel htmlFor="add-amount">Amount</InputLabel>
              <OutlinedInput
                id="add-amount"
                label="Amount"
                name="amount"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                onChange={addTransactionFormHandler.inputChange}
                startAdornment={<InputAdornment position="start">€</InputAdornment>}
              />
            </FormControl>

            <TextField
              id="add-information"
              variant="outlined"
              label="Information"
              name="information"
              sx={{ ...FormStyle, mb: 0 }}
              multiline
              rows={3}
              onChange={addTransactionFormHandler.inputChange}
            />
          </form>
        )}
      </FormDrawer>

      {/* Add Subscription */}
      <FormDrawer
        open={showSubscriptionForm}
        heading="Add Subscription"
        onClose={addSubscriptionFormHandler.close}
        onSave={addSubscriptionFormHandler.save}
      >
        {errorMessage.length > 1 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {categories.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Info</AlertTitle>
            To be able to create a transaction you have to create a category under{' '}
            <strong>Categories {'>'} Add Category</strong> before.{' '}
          </Alert>
        )}

        {paymentMethods.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Info</AlertTitle>
            To be able to create a transaction you have to create a payment method under{' '}
            <strong>Payment Methods {'>'} Add Payment Method</strong> before.{' '}
          </Alert>
        )}

        {!loading && categories.length > 0 && paymentMethods.length > 0 && (
          <form>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {screenSize === 'small' ? (
                <MobileDatePicker
                  label="Execute at"
                  inputFormat="dd.MM.yy"
                  value={addSubscriptionForm.execute_at || new Date()}
                  onChange={addSubscriptionFormHandler.dateChange}
                  renderInput={(params) => <TextField sx={FormStyle} {...params} />}
                />
              ) : (
                <DesktopDatePicker
                  label="Execute at"
                  inputFormat="dd.MM.yy"
                  value={addSubscriptionForm.execute_at || new Date()}
                  onChange={addSubscriptionFormHandler.dateChange}
                  renderInput={(params) => <TextField sx={FormStyle} {...params} />}
                />
              )}
            </LocalizationProvider>

            <Box display="flex" flexDirection="row" justifyContent="space-between">
              <Autocomplete
                id="add-category"
                options={categories.map((item) => ({ label: item.name, value: item.id }))}
                sx={{ width: 'calc(50% - .5rem)', mb: 2 }}
                onChange={(event, value) =>
                  addSubscriptionFormHandler.autocompleteChange(
                    event,
                    'category',
                    Number(value?.value)
                  )
                }
                renderInput={(props) => <TextField {...props} label="Category" />}
                isOptionEqualToValue={(option, value) => option.value === value.value}
              />
              <Autocomplete
                id="add-payment-method"
                options={paymentMethods.map((item) => ({
                  label: `${item.name} • ${item.provider}`,
                  value: item.id,
                }))}
                sx={{ width: 'calc(50% - .5rem)', mb: 2 }}
                onChange={(event, value) =>
                  addSubscriptionFormHandler.autocompleteChange(
                    event,
                    'paymentMethod',
                    Number(value?.value)
                  )
                }
                renderInput={(props) => <TextField {...props} label="Payment Method" />}
                isOptionEqualToValue={(option, value) => option.value === value.value}
              />
            </Box>

            <TextField
              id="add-receiver"
              variant="outlined"
              label="Receiver"
              name="receiver"
              sx={FormStyle}
              onChange={addSubscriptionFormHandler.inputChange}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel htmlFor="add-amount">Amount</InputLabel>
              <OutlinedInput
                id="add-amount"
                label="Amount"
                name="amount"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                onChange={addSubscriptionFormHandler.inputChange}
                startAdornment={<InputAdornment position="start">€</InputAdornment>}
              />
            </FormControl>

            <TextField
              id="add-information"
              variant="outlined"
              label="Information"
              name="information"
              sx={{ ...FormStyle, mb: 0 }}
              multiline
              rows={3}
              onChange={addSubscriptionFormHandler.inputChange}
            />
          </form>
        )}
      </FormDrawer>
    </Grid>
  );
};
