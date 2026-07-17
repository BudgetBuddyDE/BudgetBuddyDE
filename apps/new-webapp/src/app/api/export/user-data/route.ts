import {headers} from 'next/headers';
import {NextResponse} from 'next/server';
import {apiClient} from '@/apiClient';
import {authClient} from '@/authClient';

type PageResult = Promise<[{data?: unknown[] | null; totalCount?: number} | null, unknown]>;

async function collectPages(load: (from: number, to: number) => PageResult): Promise<unknown[]> {
  const records: unknown[] = [];
  let totalCount = 0;
  do {
    const from = records.length;
    const [response, error] = await load(from, from + 500);
    if (error || !response) throw new Error('Export source unavailable');
    records.push(...(response.data ?? []));
    totalCount = response.totalCount ?? records.length;
  } while (records.length < totalCount);
  return records;
}

export async function GET() {
  const requestHeaders = await headers();
  const session = await authClient.getSession({fetchOptions: {headers: requestHeaders}});
  if (session.error || !session.data) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const config = {headers: requestHeaders, cache: 'no-store' as const};
  try {
    const [transactions, categories, paymentMethods, budgets, recurringPayments] = await Promise.all([
      collectPages((from, to) => apiClient.backend.transaction.getAll({from, to, sort: 'date', order: 'asc'}, config)),
      collectPages((from, to) => apiClient.backend.category.getAll({from, to}, config)),
      collectPages((from, to) => apiClient.backend.paymentMethod.getAll({from, to}, config)),
      collectPages((from, to) => apiClient.backend.budget.getAll({from, to}, config)),
      collectPages((from, to) => apiClient.backend.recurringPayment.getAll({from, to}, config)),
    ]);
    const exportedAt = new Date().toISOString();
    const archive = {
      version: 1,
      exportedAt,
      user: {id: session.data.user.id, name: session.data.user.name, email: session.data.user.email},
      transactions,
      categories,
      paymentMethods,
      budgets,
      recurringPayments,
    };
    return new NextResponse(JSON.stringify(archive, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="budgetbuddy-user-data-${exportedAt.slice(0, 10)}.json"`,
      },
    });
  } catch {
    return NextResponse.json(
      {error: 'User data export could not be completed'},
      {status: 502, headers: {'Cache-Control': 'private, no-store'}},
    );
  }
}
