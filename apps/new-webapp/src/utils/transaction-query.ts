import type {IGetAllTransactionsQuery} from '@budgetbuddyde/api/transaction';

export interface TransactionQuery {
  search: string;
  dateFrom?: string;
  dateTo?: string;
  type: 'all' | 'income' | 'expense';
  categories: string[];
  paymentMethods: string[];
  sort: 'date' | 'amount' | 'category';
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

const defaults: TransactionQuery = {
  search: '',
  type: 'all',
  categories: [],
  paymentMethods: [],
  sort: 'date',
  order: 'desc',
  page: 1,
  pageSize: 25,
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function list(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? value.split(',') : [];
  return [
    ...new Set(
      values
        .flatMap(item => item.split(','))
        .map(item => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function parseTransactionQuery(params: Record<string, string | string[] | undefined>): TransactionQuery {
  const type = first(params.type);
  const sort = first(params.sort);
  const order = first(params.order);
  const page = Number(first(params.page));
  const pageSize = Number(first(params.pageSize));
  const dateFrom = first(params.from);
  const dateTo = first(params.to);
  return {
    search: (first(params.search) ?? '').slice(0, 100),
    dateFrom: /^\d{4}-\d{2}-\d{2}$/.test(dateFrom ?? '') ? dateFrom : undefined,
    dateTo: /^\d{4}-\d{2}-\d{2}$/.test(dateTo ?? '') ? dateTo : undefined,
    type: type === 'income' || type === 'expense' ? type : defaults.type,
    categories: list(params.category),
    paymentMethods: list(params.paymentMethod),
    sort: sort === 'amount' || sort === 'category' ? sort : defaults.sort,
    order: order === 'asc' ? 'asc' : defaults.order,
    page: Number.isInteger(page) && page > 0 ? page : defaults.page,
    pageSize: [10, 25, 50, 100].includes(pageSize) ? pageSize : defaults.pageSize,
  };
}

export function serializeTransactionQuery(query: TransactionQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.dateFrom) params.set('from', query.dateFrom);
  if (query.dateTo) params.set('to', query.dateTo);
  if (query.type !== 'all') params.set('type', query.type);
  if (query.categories.length) params.set('category', query.categories.join(','));
  if (query.paymentMethods.length) params.set('paymentMethod', query.paymentMethods.join(','));
  if (query.sort !== 'date') params.set('sort', query.sort);
  if (query.order !== 'desc') params.set('order', query.order);
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== 25) params.set('pageSize', String(query.pageSize));
  return params;
}

export function toTransactionApiQuery(query: TransactionQuery): IGetAllTransactionsQuery {
  const from = (query.page - 1) * query.pageSize;
  return {
    search: query.search || undefined,
    from,
    to: from + query.pageSize,
    sort: query.sort,
    order: query.order,
    $type: query.type === 'all' ? undefined : query.type,
    $dateFrom: query.dateFrom ? new Date(`${query.dateFrom}T00:00:00`) : undefined,
    $dateTo: query.dateTo ? new Date(`${query.dateTo}T23:59:59`) : undefined,
    $categories: query.categories as IGetAllTransactionsQuery['$categories'],
    $paymentMethods: query.paymentMethods as IGetAllTransactionsQuery['$paymentMethods'],
  };
}
