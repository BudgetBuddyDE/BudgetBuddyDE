import type {IGetAllTransactionsQuery, TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {headers} from 'next/headers';
import {NextResponse} from 'next/server';
import {apiClient} from '@/apiClient';
import {authClient} from '@/authClient';
import {parseTransactionQuery, toTransactionApiQuery} from '@/utils/transaction-query';

function protectSpreadsheetValue(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: unknown): string {
  const text = protectSpreadsheetValue(value === null || value === undefined ? '' : String(value));
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const session = await authClient.getSession({fetchOptions: {headers: requestHeaders}});
  if (session.error || !session.data) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'csv';
  const period = url.searchParams.get('period');
  const year = url.searchParams.get('year');
  if (!['csv', 'json'].includes(format)) return NextResponse.json({error: 'Unsupported export format'}, {status: 400});
  let filters: IGetAllTransactionsQuery;
  let label: string;
  if (period && /^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    const [periodYear, month] = period.split('-').map(Number);
    filters = {
      from: 0,
      to: 500,
      sort: 'date',
      order: 'asc',
      $dateFrom: new Date(periodYear, month - 1, 1),
      $dateTo: new Date(periodYear, month, 0, 23, 59, 59),
    };
    label = period;
  } else if (year && /^\d{4}$/.test(year)) {
    const parsedYear = Number(year);
    filters = {
      from: 0,
      to: 500,
      sort: 'date',
      order: 'asc',
      $dateFrom: new Date(parsedYear, 0, 1),
      $dateTo: new Date(parsedYear, 11, 31, 23, 59, 59),
    };
    label = year;
  } else if (url.searchParams.get('scope') === 'filtered') {
    const query = parseTransactionQuery(Object.fromEntries(url.searchParams));
    filters = {...toTransactionApiQuery(query), from: 0, to: 500};
    label = 'filtered';
  } else {
    return NextResponse.json({error: 'A valid period, year, or filtered scope is required'}, {status: 400});
  }
  const pageSize = 500;
  const transactions: TExpandedTransaction[] = [];
  let total = 0;
  do {
    const offset = transactions.length;
    const [response, error] = await apiClient.backend.transaction.getAll(
      {...filters, from: offset, to: offset + pageSize},
      {headers: requestHeaders, cache: 'no-store'},
    );
    if (error || !response) return NextResponse.json({error: 'Export data could not be loaded'}, {status: 502});
    transactions.push(...(response.data ?? []));
    total = response.totalCount ?? transactions.length;
  } while (transactions.length < total);
  const fileName = `budgetbuddy-transactions-${label}.${format}`;
  const commonHeaders = {
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="${fileName}"`,
  };
  if (format === 'json')
    return new NextResponse(JSON.stringify(transactions, null, 2), {
      headers: {...commonHeaders, 'Content-Type': 'application/json; charset=utf-8'},
    });
  const columns = ['date', 'type', 'amount', 'receiver', 'category', 'paymentMethod', 'information'];
  const rows = transactions.map(transaction => [
    new Date(transaction.processedAt).toISOString(),
    transaction.transferAmount >= 0 ? 'income' : 'expense',
    transaction.transferAmount,
    transaction.receiver,
    transaction.category.name,
    transaction.paymentMethod.name,
    transaction.information,
  ]);
  const csv = [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
  return new NextResponse(`\uFEFF${csv}`, {headers: {...commonHeaders, 'Content-Type': 'text/csv; charset=utf-8'}});
}
