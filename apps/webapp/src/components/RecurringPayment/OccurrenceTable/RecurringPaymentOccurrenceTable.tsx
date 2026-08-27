'use client';

import type {TExecutionPlan, TRecurringPaymentOccurrence} from '@budgetbuddyde/api/recurringPayment';
import {FormControlLabel, Stack, Switch, Typography} from '@mui/material';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import {apiClient} from '@/apiClient';
import {CategoryChip} from '@/components/Category/CategoryChip';
import {DateRangePicker} from '@/components/Form/DateRangePicker';
import {PaymentMethodChip} from '@/components/PaymentMethod/PaymentMethodChip';
import {EntityTable, type ColumnDefinition} from '@/components/Table';
import {Formatter} from '@/utils/Formatter';
import {formatDateOnlyForDisplay, formatLocalDateOnly, parseLocalDateOnly} from '../dateOnly';
import {executionPlanLabels} from '../executionPlan';
import type {OccurrenceRange} from './occurrenceRange';

type OccurrenceRow = TRecurringPaymentOccurrence & {rowId: string};

export const RecurringPaymentOccurrenceTable: React.FC<{initialRange: OccurrenceRange}> = ({initialRange}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dateFrom, setDateFrom] = React.useState(initialRange.dateFrom);
  const [dateTo, setDateTo] = React.useState(initialRange.dateTo);
  const [includePaused, setIncludePaused] = React.useState(initialRange.includePaused);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);
  const [rows, setRows] = React.useState<OccurrenceRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const updateUrl = React.useCallback(
    (nextFrom: string, nextTo: string, nextIncludePaused: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('dateFrom', nextFrom);
      params.set('dateTo', nextTo);
      if (nextIncludePaused) params.set('includePaused', 'true');
      else params.delete('includePaused');
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);
    void apiClient.backend.recurringPayment
      .getOccurrences({
        $dateFrom: dateFrom,
        $dateTo: dateTo,
        $includePaused: includePaused || undefined,
        from: page * rowsPerPage,
        to: page * rowsPerPage + rowsPerPage,
      })
      .then(([result, requestError]) => {
        if (ignore) return;
        if (requestError) {
          setRows([]);
          setTotalCount(0);
          setError(new Error(requestError.message));
          return;
        }
        setRows(
          [...(result?.data ?? [])]
            .sort((left, right) => left.scheduledFor.localeCompare(right.scheduledFor))
            .map(occurrence => ({
              ...occurrence,
              rowId: `${occurrence.recurringPayment.id}-${occurrence.scheduledFor}`,
            })),
        );
        setTotalCount(result?.totalCount ?? 0);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [dateFrom, dateTo, includePaused, page, rowsPerPage]);

  const columns: ColumnDefinition<OccurrenceRow>[] = React.useMemo(
    () => [
      {
        key: 'scheduledFor',
        label: 'Date',
        width: 120,
        renderCell: value => formatDateOnlyForDisplay(value as string),
      },
      {
        key: 'recurringPayment.executionPlan',
        label: 'Plan / Frequency',
        width: 152,
        renderCell: (_value, row) => executionPlanLabels[row.recurringPayment.executionPlan as TExecutionPlan],
      },
      {key: 'recurringPayment.receiver', label: 'Receiver', width: 168},
      {
        key: 'recurringPayment.category',
        label: 'Category',
        width: 140,
        renderCell: (_value, row) => <CategoryChip categoryName={row.recurringPayment.category.name} size="small" />,
      },
      {
        key: 'recurringPayment.paymentMethod',
        label: 'Payment Method',
        width: 180,
        renderCell: (_value, row) => (
          <PaymentMethodChip paymentMethodName={row.recurringPayment.paymentMethod.name} size="small" />
        ),
      },
      {
        key: 'recurringPayment.transferAmount',
        label: 'Amount',
        align: 'right',
        width: 120,
        renderCell: (_value, row) => (
          <Typography variant="body2">
            {Formatter.currency.formatBalance(row.recurringPayment.transferAmount)}
          </Typography>
        ),
      },
    ],
    [],
  );

  return (
    <EntityTable<OccurrenceRow, 'rowId'>
      slice={{data: rows, isLoading, error, totalCount}}
      dataKey="rowId"
      columns={columns}
      toolbar={{
        title: 'Occurrences',
        subtitle: 'Concrete recurring payment dates',
        showCount: true,
        children: (
          <Stack direction={{xs: 'column', md: 'row'}} gap={1} alignItems={{xs: 'stretch', md: 'center'}}>
            <DateRangePicker
              key={`${dateFrom}-${dateTo}`}
              defaultValue={{startDate: parseLocalDateOnly(dateFrom), endDate: parseLocalDateOnly(dateTo)}}
              dateFormat="dd.MM.yyyy"
              size="small"
              slotProps={{stack: {direction: {xs: 'column', sm: 'row'}}}}
              onDateRangeChange={(start, end) => {
                if (!start || !end) return;
                const nextFrom = formatLocalDateOnly(start);
                const nextTo = formatLocalDateOnly(end);
                setDateFrom(nextFrom);
                setDateTo(nextTo);
                setPage(0);
                updateUrl(nextFrom, nextTo, includePaused);
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={includePaused}
                  onChange={event => {
                    const checked = event.target.checked;
                    setIncludePaused(checked);
                    setPage(0);
                    updateUrl(dateFrom, dateTo, checked);
                  }}
                />
              }
              label="Include paused"
              sx={{whiteSpace: 'nowrap'}}
            />
          </Stack>
        ),
      }}
      emptyMessage="No recurring payment occurrences in this date range"
      pagination={{
        page,
        rowsPerPage,
        onPageChange: setPage,
        onRowsPerPageChange: value => {
          setRowsPerPage(value);
          setPage(0);
        },
      }}
    />
  );
};
