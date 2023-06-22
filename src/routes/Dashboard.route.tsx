import { Add as AddIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { Box, Grid, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { ParentSize } from '@visx/responsive';
import React from 'react';
import {
    ActionPaper,
    Card,
    CircularProgress,
    CreateSubscription,
    CreateTransaction,
    IStatsProps,
    NoResults,
    PageHeader,
    PieChart,
    SpendingChartType,
    Stats,
    StatsIconStyle,
    Subscription,
    Transaction,
} from '../components';
import { AuthContext, StoreContext } from '../context';
import { useFetchSubscriptions, useFetchTransactions } from '../hooks';
import { Subscription as SubscriptionModel, Transaction as TransactionModel } from '../models';
import { BudgetService, DateService, ExpenseService, SubscriptionService, TransactionService } from '../services';
import { formatBalance } from '../utils';

/** How many months do we wanna look back? */
export const MONTH_BACKLOG = 6;

/** How many items do we wanna show? */
export const LATEST_ITEMS = 6;

export const Dashboard = () => {
    const SPENDING_CHART_TYPES: { type: SpendingChartType; text: string }[] = [
        {
            type: 'MONTH',
            text: DateService.shortMonthName() + '.',
        },
        { type: 'ALL', text: 'All' },
    ];
    const { session } = React.useContext(AuthContext);
    const { loading, setLoading, categorySpendings, setCategorySpendings, monthlyAvg, setMonthlyAvg, transactions } =
        React.useContext(StoreContext);
    const fetchTransactions = useFetchTransactions();
    const fetchSubscriptions = useFetchSubscriptions();
    const [showAddTransactionForm, setShowAddTransactionForm] = React.useState(false);
    const [showSubscriptionForm, setShowSubscriptionForm] = React.useState(false);

    const latestTransactions: TransactionModel[] = React.useMemo(() => {
        return fetchTransactions.transactions
            .filter(({ date }) => new Date(new Date(date).toDateString()) <= new Date())
            .slice(0, LATEST_ITEMS);
    }, [fetchTransactions.transactions]);

    const latestSubscriptions: SubscriptionModel[] = React.useMemo(() => {
        return fetchSubscriptions.subscriptions.slice(0, LATEST_ITEMS);
    }, [fetchSubscriptions.subscriptions]);

    const StatsCards: IStatsProps[] = [
        {
            title: React.useMemo(() => {
                return formatBalance(SubscriptionService.getPlannedSpendings(fetchSubscriptions.subscriptions));
            }, [fetchSubscriptions.subscriptions]),
            subtitle: 'Expenses (planned)',
            info: 'Sum of transactions and subscriptions that will be executed this month',
            icon: <ScheduleIcon sx={StatsIconStyle} />,
            loading: fetchSubscriptions.loading,
        },
        {
            title: React.useMemo(() => {
                return formatBalance(
                    SubscriptionService.getUpcomingSpendings(
                        fetchSubscriptions.subscriptions,
                        fetchTransactions.transactions
                    )
                );
            }, [fetchSubscriptions.subscriptions, fetchTransactions.transactions]),
            subtitle: 'Expenses (upcoming)',
            info: 'Sum of transactions and subscriptions that have yet to be executed this month',
            icon: <ScheduleIcon sx={StatsIconStyle} />,
            loading: fetchSubscriptions.loading || fetchTransactions.loading,
        },
        {
            title: React.useMemo(() => {
                return formatBalance(TransactionService.getReceivedEarnings(fetchTransactions.transactions));
            }, [fetchTransactions.transactions]),
            subtitle: 'Earnings (received)',
            info: 'Sum of transactions and subscriptions that have been executed in favor of you',
            icon: <ScheduleIcon sx={StatsIconStyle} />,
            loading: fetchTransactions.loading,
        },
        {
            title: React.useMemo(() => {
                return formatBalance(
                    SubscriptionService.getUpcomingEarnings(
                        fetchSubscriptions.subscriptions,
                        fetchTransactions.transactions
                    )
                );
            }, [fetchSubscriptions.subscriptions, fetchTransactions.transactions]),
            subtitle: 'Earnings (upcoming)',
            info: 'Sum of transactions and subscriptions that still have to be executed in favor of you',
            icon: <ScheduleIcon sx={StatsIconStyle} />,
            loading: fetchSubscriptions.loading || fetchTransactions.loading,
        },
        {
            title: React.useMemo(() => {
                return formatBalance(monthlyAvg.data ? monthlyAvg.data.avg : 0);
            }, [monthlyAvg]),
            subtitle: 'Balance (estimated)',
            info: `Estimated balance based on the past ${MONTH_BACKLOG} months`,
            icon: <ScheduleIcon sx={StatsIconStyle} />,
            loading: loading && !monthlyAvg.fetched,
        },
        {
            title: React.useMemo(() => {
                return formatBalance(
                    TransactionService.getReceivedEarnings(fetchTransactions.transactions) -
                        TransactionService.getPaidSpendings(fetchTransactions.transactions)
                );
            }, [fetchTransactions.transactions]),
            subtitle: 'Balance',
            info: 'Calculated balance after deduction of all expenses from the income',
            icon: <ScheduleIcon sx={StatsIconStyle} />,
            loading: fetchTransactions.loading,
        },
    ];

    const fetchCategorySpendings = () => {
        if (!session || !session.user) return;
        setLoading(true);
        Promise.all([
            ExpenseService.getCurrentMonthExpenses(session.user.id),
            ExpenseService.getAllTimeExpenses(session.user.id),
        ])
            .then(([getCurrentMonthExpenses, getAllTimeExpenses]) => {
                setCategorySpendings({
                    type: 'FETCH_DATA',
                    fetchedBy: session!.user!.id,
                    data: {
                        chart: 'MONTH',
                        month:
                            getCurrentMonthExpenses !== null
                                ? getCurrentMonthExpenses.map(({ category, sum }) => ({
                                      label: category.name,
                                      value: Math.abs(sum),
                                  }))
                                : [],
                        allTime:
                            getAllTimeExpenses !== null
                                ? getAllTimeExpenses.map(({ category, sum }) => ({
                                      label: category.name,
                                      value: Math.abs(sum),
                                  }))
                                : [],
                    },
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    React.useEffect(() => {
        if (!transactions.fetched || !transactions.data || transactions.data.length < 1) return;
        fetchCategorySpendings();
    }, [fetchTransactions.transactions]);

    React.useEffect(() => {
        if (!session || !session.user) return setCategorySpendings({ type: 'CLEAR_DATA' });
        if (categorySpendings.fetched && categorySpendings.fetchedBy === session.user.id && categorySpendings.data)
            return;
        fetchCategorySpendings();
    }, [session, categorySpendings]);

    React.useEffect(() => {
        if (!session || !session.user) return setMonthlyAvg({ type: 'CLEAR_DATA' });
        if (monthlyAvg.fetched && monthlyAvg.fetchedBy === session.user.id && monthlyAvg.data) return;
        setLoading(true);
        BudgetService.getMonthlyBalanceAvg(MONTH_BACKLOG)
            .then((result) => setMonthlyAvg({ type: 'FETCH_DATA', data: result, fetchedBy: session!.user!.id }))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [session, monthlyAvg]);

    return (
        <Grid container spacing={3}>
            <PageHeader
                title={`Welcome, ${(session && session.user && session.user.user_metadata.username) || 'Username'}!`}
                description="All in one page"
            />

            {/* Stats */}
            <Grid container item columns={12} spacing={2}>
                {StatsCards.map((props, index, list) => {
                    const xs = index + 1 === list.length && list.length % 2 > 0 ? 12 : 6;
                    return (
                        <Grid key={index} item xs={xs} md={2} lg={2}>
                            <Stats {...props} />
                        </Grid>
                    );
                })}
            </Grid>

            {/* Subscriptions */}
            <Grid item xs={12} md={6} lg={4} order={{ xs: 3, md: 1 }}>
                <Card>
                    <Card.Header>
                        <div>
                            <Card.Title>Subscriptions</Card.Title>
                            <Card.Subtitle>Your upcoming subscriptions</Card.Subtitle>
                        </div>
                        <Card.HeaderActions>
                            <ActionPaper>
                                <Tooltip title="Add Subscription">
                                    <IconButton onClick={() => setShowSubscriptionForm(true)} color="primary">
                                        <AddIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </ActionPaper>
                        </Card.HeaderActions>
                    </Card.Header>
                    <Card.Body>
                        {fetchSubscriptions.loading ? (
                            <CircularProgress />
                        ) : latestSubscriptions.length > 0 ? (
                            latestSubscriptions.map(({ id, categories, receiver, amount, execute_at }) => (
                                <Subscription
                                    key={id}
                                    title={receiver}
                                    subtitle={[]}
                                    category={categories}
                                    executeAt={execute_at}
                                    amount={amount}
                                />
                            ))
                        ) : (
                            <NoResults sx={{ mt: 2 }} text="No subscriptions found" />
                        )}
                    </Card.Body>
                </Card>
            </Grid>

            {/* Spendings chart */}
            <Grid item xs={12} md={6} lg={4} order={{ xs: 1, md: 2 }}>
                <Card>
                    <Card.Header>
                        <Box>
                            <Card.Title>Spendings</Card.Title>
                            <Card.Subtitle>Categorized Spendings</Card.Subtitle>
                        </Box>
                        <Card.HeaderActions>
                            <ActionPaper>
                                <ToggleButtonGroup
                                    size="small"
                                    color="primary"
                                    value={categorySpendings.data?.chart}
                                    onChange={(event: React.BaseSyntheticEvent) => {
                                        setCategorySpendings({
                                            type: 'UPDATE_DATA',
                                            data: {
                                                chart: event.target.value,
                                                month: categorySpendings.data?.month || [],
                                                allTime: categorySpendings.data?.allTime || [],
                                            },
                                        });
                                    }}
                                    exclusive
                                >
                                    {SPENDING_CHART_TYPES.map((button) => (
                                        <ToggleButton key={button.type} value={button.type}>
                                            {button.text}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </ActionPaper>
                        </Card.HeaderActions>
                    </Card.Header>
                    <Card.Body>
                        {loading && !categorySpendings.fetched ? (
                            <CircularProgress />
                        ) : categorySpendings.data &&
                          categorySpendings.data[categorySpendings.data.chart === 'MONTH' ? 'month' : 'allTime']
                              .length > 0 ? (
                            <Box sx={{ display: 'flex', flex: 1, mt: '1rem' }}>
                                <ParentSize>
                                    {({ width }) => (
                                        <PieChart
                                            width={width}
                                            height={width}
                                            data={
                                                categorySpendings.data
                                                    ? categorySpendings.data.chart === 'MONTH'
                                                        ? categorySpendings.data.month
                                                        : categorySpendings.data.allTime
                                                    : []
                                            }
                                            formatAsCurrency
                                            showTotalSum
                                        />
                                    )}
                                </ParentSize>
                            </Box>
                        ) : (
                            <NoResults sx={{ mt: 2 }} />
                        )}
                    </Card.Body>
                </Card>
            </Grid>

            {/* Transactions */}
            <Grid item xs={12} md={6} lg={4} order={{ xs: 2, md: 3 }}>
                <Card>
                    <Card.Header>
                        <Box>
                            <Card.Title>Transactions</Card.Title>
                            <Card.Subtitle>Your latest transactions</Card.Subtitle>
                        </Box>
                        <Card.HeaderActions>
                            <ActionPaper>
                                <Tooltip title="Add Transaction">
                                    <IconButton onClick={() => setShowAddTransactionForm(true)} color="primary">
                                        <AddIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </ActionPaper>
                        </Card.HeaderActions>
                    </Card.Header>
                    <Card.Body>
                        {fetchTransactions.loading ? (
                            <CircularProgress />
                        ) : latestTransactions.length > 0 ? (
                            latestTransactions.map(({ id, categories, receiver, amount, date }) => (
                                <Transaction
                                    key={id}
                                    title={receiver}
                                    subtitle={[]}
                                    category={categories}
                                    date={new Date(date)}
                                    amount={amount}
                                />
                            ))
                        ) : (
                            <NoResults sx={{ mt: 2 }} text="No transactions found" />
                        )}
                    </Card.Body>
                </Card>
            </Grid>

            <CreateTransaction open={showAddTransactionForm} setOpen={(show) => setShowAddTransactionForm(show)} />

            <CreateSubscription open={showSubscriptionForm} setOpen={(show) => setShowSubscriptionForm(show)} />
        </Grid>
    );
};
