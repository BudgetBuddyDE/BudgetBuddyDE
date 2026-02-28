'use client';

import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';
import {subMonths} from 'date-fns';
import React from 'react';
import {apiClient} from '@/apiClient';
import {DateRangePicker, type DateRangeState} from '@/components/Form/DateRangePicker';
import {DataTable, type DataTableColumn} from '@/components/Table';
import {useFetch} from '@/hooks/useFetch';
import {Formatter} from '@/utils/Formatter';

export type HistoricalDataType = 'BASIC' | 'GROUPED_BY_CATEGORY';

export type HistoricalBalanceTableProps = {
  type: HistoricalDataType;
  dense?: boolean;
};

type RowData = (THistoricalBalance | THistoricalCategoryBalance) & {id: string};

export const HistoricalBalanceTable: React.FC<HistoricalBalanceTableProps> = ({type, dense = false}) => {
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
      console.warn(
        'HistoricalBalanceLineChart: Both start and end dates must be provided. Reverting to default date range.',
      );
      setDateRange(DEFAULT_DATE_RANGE);
      return;
    }
    setDateRange({startDate: start, endDate: end});
  };

  const columns: DataTableColumn<RowData>[] = React.useMemo(() => {
    const baseColumns: DataTableColumn<RowData>[] = [
      {
        field: 'date',
        headerName: 'Period',
        flex: 1,
        minWidth: 120,
        valueFormatter: value => Formatter.date.formatWithPattern(new Date(value as string), 'MMMM yyyy'),
      },
      {
        field: 'income',
        headerName: 'Income',
        flex: 1,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: value => Formatter.currency.formatBalance(value as number),
      },
      {
        field: 'expenses',
        headerName: 'Expenses',
        flex: 1,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: value => Formatter.currency.formatBalance(value as number),
      },
      {
        field: 'balance',
        headerName: 'Balance',
        flex: 1,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: value => Formatter.currency.formatBalance(value as number),
      },
    ];

    if (showCategory) {
      baseColumns.splice(1, 0, {
        field: 'category',
        headerName: 'Category',
        flex: 1,
        minWidth: 120,
        valueGetter: (_value, row) => ('category' in row ? row.category?.name : '-'),
      });
    }

    return baseColumns;
  }, [showCategory]);

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      isLoading={isLoading}
      error={error}
      emptyMessage="Create a transaction to begin tracking your activity."
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
        title: `Historical balances (${data?.length ?? 0})`,
        subtitle: showCategory ? 'Grouped by date and category' : 'Grouped by date',
        actions: [
          {
            id: 'date-range-picker',
            type: 'custom',
            component: (
              <DateRangePicker
                size="small"
                defaultValue={DEFAULT_DATE_RANGE}
                slotProps={{
                  startDateTicker: {openTo: 'month', view: 'month'},
                  endDateTicker: {openTo: 'month', view: 'month'},
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
