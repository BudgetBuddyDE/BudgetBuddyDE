import React from 'react';
import {useNavigate} from 'react-router-dom';
import Chart from 'react-apexcharts';
import {
  ActionPaper,
  DateRange,
  FullScreenDialog,
  StyledAutocompleteOption,
  type TDateRange,
  type TFullScreenDialogProps,
} from '@/components/Base';
import {Formatter} from '@/services';
import {Autocomplete, Box, TextField, CircularProgress, useTheme, Typography} from '@mui/material';
import {useFetchCategories} from '@/components/Category';
import {type TCategory, type TTransaction} from '@budgetbuddyde/types';
import {format, subMonths} from 'date-fns';
import {useFetchTransactions} from '@/components/Transaction';
import {useKeyPress} from '@/hooks/useKeyPress.hook.ts';
import {DownloadButton} from '@/components/Download';

export type TAnalyticsViewProps =
  | {navigateOnClose: true; navigateTo: string}
  | ({navigateOnClose: false} & Pick<TFullScreenDialogProps, 'onClose'>);

export const AnalyticsView: React.FC<TAnalyticsViewProps> = props => {
  const theme = useTheme();
  const navigate = useNavigate();
  const autocompleteRef = React.useRef<HTMLInputElement | null>(null);
  const {loading: loadingCategories, categories} = useFetchCategories();
  const {loading: loadingTransactions, transactions} = useFetchTransactions();
  const [dateRange, setDateRange] = React.useState<TDateRange>({
    startDate: subMonths(new Date(), 12),
    endDate: new Date(),
  });
  const [selectedCategories, setSelectedCategories] = React.useState<{label: string; value: TCategory['id']}[]>([]);
  useKeyPress(
    ['k'],
    e => {
      e.preventDefault();
      if (autocompleteRef.current) {
        // FIXME: This is not working
        // if (document.activeElement === autocompleteRef.current) {
        //   document.activeElement.blur();
        // }

        autocompleteRef.current.focus();
      }
    },
    null,
    true,
  );

  const filterOptions = React.useMemo(() => {
    return categories.map(({id, name}) => ({label: name, value: id}));
  }, [categories]);

  const dateRangeLabels: string[] = React.useMemo(() => {
    const labels: string[] = [];
    let tempDate = new Date(dateRange.startDate);
    while (tempDate <= dateRange.endDate) {
      labels.push(format(tempDate, 'yyyy-MM'));
      tempDate = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1);
    }
    return labels;
  }, [dateRange]);

  const chartData: {name: string; data: number[]}[] = React.useMemo(() => {
    const relevantTransactions: TTransaction[] = transactions
      // currently only interested in expenses
      .filter(({transferAmount}) => transferAmount < 0)
      // determine if transaction is within date range
      .filter(({processedAt}) => processedAt >= dateRange.startDate && processedAt <= dateRange.endDate)
      // determine if transaction is within selected categories
      .filter(({category: {id}}) => selectedCategories.some(({value}) => value === id));

    const stats: Map<TCategory['id'], {name: string; data: Map<string, number>}> = new Map();
    for (const {
      processedAt,
      category: {id: categoryId, name: categoryName},
      transferAmount,
    } of relevantTransactions) {
      const dateKey = format(processedAt, 'yyyy-MM');
      if (stats.has(categoryId)) {
        const {data} = stats.get(categoryId)!;

        if (data.has(dateKey)) {
          const sum = data.get(dateKey)!;
          data.set(dateKey, sum + Math.abs(transferAmount));
        } else {
          data.set(dateKey, Math.abs(transferAmount));
        }
      } else {
        stats.set(categoryId, {name: categoryName, data: new Map([[dateKey, Math.abs(transferAmount)]])});
      }
    }

    // Ensure every month has a value for each category
    for (const [, {data}] of stats) {
      for (const label of dateRangeLabels) {
        if (!data.has(label)) {
          data.set(label, 0);
        }
      }
    }

    // Now transform map to chart data
    return Array.from(stats).map(([, {name, data}]) => ({
      name,
      data: dateRangeLabels.map(label => data.get(label) ?? 0),
    }));
  }, [categories, transactions, dateRange, dateRangeLabels, selectedCategories]);

  const handleClose = () => {
    if (props.navigateOnClose) {
      navigate(props.navigateTo);
    } else props.onClose();
  };

  return (
    <FullScreenDialog
      title={'Analytics'}
      open={true}
      onClose={handleClose}
      boxProps={{sx: {display: 'flex', flexDirection: 'column', flex: 1}}}>
      {loadingCategories || loadingTransactions ? (
        <Box sx={{display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <CircularProgress />
        </Box>
      ) : (
        <React.Fragment>
          <Box sx={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
            <Box sx={{display: 'flex', flexDirection: 'row', flex: 1}}>
              <Autocomplete
                sx={{width: {xs: '100%', sm: '30%'}, maxWidth: {xs: 'unset', sm: '500px'}, mb: {xs: 2, sm: 0}}}
                renderInput={params => (
                  <TextField
                    {...params}
                    inputRef={input => {
                      autocompleteRef.current = input;
                    }}
                    label="Categories"
                    placeholder={'Select categories'}
                  />
                )}
                onChange={(_event, value) => setSelectedCategories(value)}
                value={selectedCategories}
                options={filterOptions}
                renderOption={(props, option, {selected}) => (
                  <StyledAutocompleteOption {...props} selected={selected}>
                    {option.label}
                  </StyledAutocompleteOption>
                )}
                disableCloseOnSelect
                multiple
              />

              <DownloadButton
                exportFormat={'JSON'}
                exportFileName={`bb_category_analytics_${format(new Date(), 'yyyy_mm_dd')}`}
                data={chartData}
                size={'large'}
                sx={{ml: 1}}
                withTooltip>
                Export data
              </DownloadButton>
            </Box>

            <Box>
              <DateRange
                defaultStartDate={dateRange.startDate}
                defaultEndDate={dateRange.endDate}
                onDateChange={setDateRange}
              />
            </Box>
          </Box>

          <Box sx={{flex: 1, mt: 2}}>
            {selectedCategories.length > 0 && chartData.length > 0 ? (
              <Chart
                type={'bar'}
                with={'100%'}
                height={'99.99%'}
                series={chartData}
                options={{
                  chart: {
                    type: 'bar',
                    toolbar: {
                      show: false,
                    },
                  },
                  xaxis: {
                    labels: {
                      style: {
                        colors: theme.palette.text.primary,
                      },
                    },
                    categories: dateRangeLabels.map(dateStr => {
                      const date = new Date(dateStr);
                      return `${Formatter.formatDate().shortMonthName(date)} ${date.getFullYear()}`;
                    }),
                  },
                  dataLabels: {
                    enabled: false,
                  },
                  grid: {
                    borderColor: theme.palette.action.disabled,
                    strokeDashArray: 5,
                  },
                  yaxis: {
                    forceNiceScale: true,
                    opposite: true,
                    labels: {
                      style: {
                        colors: theme.palette.text.primary,
                      },
                      formatter(val: number) {
                        return Formatter.formatBalance(val);
                      },
                    },
                  },
                  legend: {
                    position: 'bottom',
                    horizontalAlign: 'left',
                    labels: {
                      colors: 'white',
                    },
                  },
                  tooltip: {
                    theme: 'dark',
                    y: {
                      formatter(val: number) {
                        return Formatter.formatBalance(val);
                      },
                    },
                  },
                }}
              />
            ) : (
              <ActionPaper
                sx={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  p: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Typography variant={'h1'} textAlign={'center'}>
                  {selectedCategories.length === 0 ? 'No categories selected' : 'No data available'}
                </Typography>
              </ActionPaper>
            )}
          </Box>
        </React.Fragment>
      )}
    </FullScreenDialog>
  );
};

export default AnalyticsView;
