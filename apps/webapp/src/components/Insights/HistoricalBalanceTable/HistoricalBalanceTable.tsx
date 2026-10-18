'use client';

import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';
import {subMonths} from 'date-fns';
import React from 'react';
import {apiClient} from '@/apiClient';
import {DateRangePicker, type DateRangeState} from '@/components/Form/DateRangePicker';
import {DataTable, type DataTableColumn} from '@/components/Table';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
import {useFetch} from '@/hooks/useFetch';
import {usePreferences} from '@/hooks/usePreferences';
import {logger} from '@/logger';
import {Formatter} from '@/utils/Formatter';

export type HistoricalDataType = 'BASIC' | 'GROUPED_BY_CATEGORY';

export type HistoricalBalanceTableProps = {
  type: HistoricalDataType;
  dense?: boolean;
};

type RowData = (THistoricalBalance | THistoricalCategoryBalance) & {id: string};

export const HistoricalBalanceTable: React.FC<HistoricalBalanceTableProps> = ({type, dense = false}) => {
  const t = useAppTranslations();
  const currencyFormatter = useCurrencyFormatter();
  const {locale} = usePreferences();
  const DEFAULT_DATE_RANGE = {
    startDate: subMonths(new Date(), type === 'BASIC' ? 12 : 1),
    endDate: new Date(),
  } satisfies DateRangeState;
  const showCategory = type === 'GROUPED_BY_CATEGORY';
  const [dateRange, setDateRange] = React.useState(DEFAULT_DATE_RANGE);

  const fetchDataFunc = React.useCallback(async () => {
    const [results, error] = showCategory
      ? await apiClient.backend.insights.getHistoricalCategoryBalance({
          $dateFrom: dateRange.startDate,
          $dateTo: dateRange.endDate,
        })
      : await apiClient.backend.insights.getHistoricalBalance({
          $dateFrom: dateRange.startDate,
          $dateTo: dateRange.endDate,
        });
    if (error) throw error;
    return results.data.toReversed().map((row, index) => ({
      ...row,
      id: `${new Date(row.date).getTime()}-${index}`,
    }));
  }, [dateRange, showCategory]);

  const {isLoading, data, error} = useFetch<RowData[]>(fetchDataFunc);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    if (!start || !end) {
      logger.warn('Both dates are required; resetting historical balance date range', {
        component: 'HistoricalBalanceTable',
      });
      setDateRange(DEFAULT_DATE_RANGE);
      return;
    }
    setDateRange({startDate: start, endDate: end});
  };

  const columns: DataTableColumn<RowData>[] = React.useMemo(() => {
    const baseColumns: DataTableColumn<RowData>[] = [
      {
        field: 'date',
        headerName: t('insights.period'),
        flex: 1,
        minWidth: 120,
        valueFormatter: value => Formatter.date.formatWithPattern(new Date(value as string), 'MMMM yyyy', locale),
      },
      {
        field: 'income',
        headerName: t('insights.income'),
        flex: 1,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: value => currencyFormatter.formatBalance(value as number),
      },
      {
        field: 'expenses',
        headerName: t('insights.expenses'),
        flex: 1,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: value => currencyFormatter.formatBalance(value as number),
      },
      {
        field: 'balance',
        headerName: t('insights.balance'),
        flex: 1,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: value => currencyFormatter.formatBalance(value as number),
      },
    ];

    if (showCategory) {
      baseColumns.splice(1, 0, {
        field: 'category',
        headerName: t('insights.category'),
        flex: 1,
        minWidth: 120,
        valueGetter: (_value, row) => ('category' in row ? row.category?.name : '-'),
      });
    }

    return baseColumns;
  }, [showCategory, currencyFormatter, locale, t]);

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      isLoading={isLoading}
      error={error}
      emptyMessage={t('insights.createATransactionToBeginTrackingYourActivity')}
      density={dense ? 'compact' : 'standard'}
      autoHeight
      pagination
      pageSizeOptions={[10, 25, 50]}
      dataGridProps={{
        initialState: {
          pagination: {paginationModel: {pageSize: 10, page: 0}},
        },
      }}
      sx={{border: 'none'}}
      toolbar={{
        title: t('insights.historicalBalancesValue0', {value0: data?.length ?? 0}),
        subtitle: showCategory ? t('insights.groupedByDateAndCategory') : t('insights.groupedByDate'),
        actions: [
          {
            id: 'date-range-picker',
            type: 'custom',
            component: (
              <DateRangePicker
                size="small"
                defaultValue={DEFAULT_DATE_RANGE}
                slotProps={{
                  startDatePicker: {openTo: 'month', view: 'month'},
                  endDatePicker: {openTo: 'month', view: 'month'},
                }}
                onDateRangeChange={handleDateRangeChange}
              />
            ),
          },
        ],
      }}
    />
  );
};
