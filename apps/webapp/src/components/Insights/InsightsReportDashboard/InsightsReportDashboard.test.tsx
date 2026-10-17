import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {StrictMode} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {buildReport, buildTransaction, categoryOption, paymentMethodOption} from '../InsightsReport.fixtures';
import {InsightsReportDashboard} from './InsightsReportDashboard';

const {
  getReportMock,
  transactionGetAllMock,
  categoryValueHelpMock,
  paymentMethodValueHelpMock,
  replaceMock,
  pushMock,
  navigation,
} = vi.hoisted(() => ({
  getReportMock: vi.fn(),
  transactionGetAllMock: vi.fn(),
  categoryValueHelpMock: vi.fn(),
  paymentMethodValueHelpMock: vi.fn(),
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
  navigation: {params: new URLSearchParams()},
}));

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      category: {getValueHelp: categoryValueHelpMock},
      paymentMethod: {getValueHelp: paymentMethodValueHelpMock},
      insights: {getReport: getReportMock},
      transaction: {getAll: transactionGetAllMock},
    },
  },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({replace: replaceMock, push: pushMock}),
  usePathname: () => '/dashboard/insights',
}));

vi.mock('@budgetbuddyde/charts', () => ({
  ComposedChart: () => <div>timeline chart</div>,
}));

vi.mock('@/components/Form/DateRangePicker', () => ({
  DateRangePicker: ({onDateRangeChange}: {onDateRangeChange: (start: Date, end: Date) => void}) => (
    <button type="button" onClick={() => onDateRangeChange(new Date(2026, 1, 1), new Date(2026, 1, 28))}>
      Apply test dates
    </button>
  ),
}));

const categories: TCategoryVH[] = [categoryOption('cat-1', 'Food'), categoryOption('cat-2', 'Rent')];
const paymentMethods: TPaymentMethodVH[] = [paymentMethodOption('pm-1', 'Card'), paymentMethodOption('pm-2', 'Cash')];
const report = buildReport();
const transactions = [buildTransaction(1)];

beforeEach(() => {
  navigation.params = new URLSearchParams();
  getReportMock.mockReset();
  transactionGetAllMock.mockReset();
  categoryValueHelpMock.mockReset();
  paymentMethodValueHelpMock.mockReset();
  replaceMock.mockReset();
  pushMock.mockReset();
  categoryValueHelpMock.mockResolvedValue([categories, null]);
  paymentMethodValueHelpMock.mockResolvedValue([paymentMethods, null]);
  getReportMock.mockResolvedValue([{data: report}, null]);
  transactionGetAllMock.mockResolvedValue([{data: transactions, totalCount: 12}, null]);
});

afterEach(() => cleanup());

describe('InsightsReportDashboard', () => {
  it('hydrates from the active options request even when a superseded request has not completed', async () => {
    navigation.params = new URLSearchParams(
      'from=2026-01-01&to=2026-01-31&granularity=month&comparison=none&cat=cat-1&pm=pm-1',
    );
    let rejectOldCategories!: (error: Error) => void;
    let resolveOldPayments!: (value: [TPaymentMethodVH[], null]) => void;
    categoryValueHelpMock.mockImplementationOnce(() => new Promise((_, reject) => (rejectOldCategories = reject)));
    paymentMethodValueHelpMock.mockImplementationOnce(() => new Promise(resolve => (resolveOldPayments = resolve)));
    render(
      <StrictMode>
        <InsightsReportDashboard />
      </StrictMode>,
    );
    expect(await screen.findByText('Receiver 1')).toBeInTheDocument();
    expect(categoryValueHelpMock).toHaveBeenCalledTimes(2);
    expect(paymentMethodValueHelpMock).toHaveBeenCalledTimes(2);
    await act(async () => {
      rejectOldCategories(new Error('Old options rejected'));
      resolveOldPayments([[], null]);
    });
    expect(screen.queryByText('Old options rejected')).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Food'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Card'})).toBeInTheDocument();
  });

  it.each(['category', 'paymentMethod', 'dates', 'pageSize'] as const)(
    'removes stale URL pages after a %s change following history navigation',
    async change => {
      transactionGetAllMock.mockResolvedValue([{data: transactions, totalCount: 200}, null]);
      navigation.params = new URLSearchParams(
        'from=2026-01-01&to=2026-01-31&granularity=month&comparison=none&page=3&pageSize=50&foreign=keep',
      );
      const {rerender} = render(<InsightsReportDashboard />);
      await waitFor(() =>
        expect(transactionGetAllMock).toHaveBeenLastCalledWith(expect.objectContaining({from: 100, to: 150})),
      );
      navigation.params = new URLSearchParams(
        'from=2026-01-01&to=2026-01-31&granularity=month&comparison=none&page=2&pageSize=25&foreign=keep',
      );
      rerender(<InsightsReportDashboard />);
      await waitFor(() =>
        expect(transactionGetAllMock).toHaveBeenLastCalledWith(expect.objectContaining({from: 25, to: 50})),
      );
      if (change === 'dates') fireEvent.click(screen.getByRole('button', {name: 'Apply test dates'}));
      else if (change === 'pageSize') {
        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.mouseDown(comboboxes[comboboxes.length - 1]);
        fireEvent.click(screen.getByRole('option', {name: '10'}));
      } else {
        fireEvent.mouseDown(
          screen.getByRole('combobox', {name: change === 'category' ? 'Categories' : 'Payment methods'}),
        );
        fireEvent.click(await screen.findByRole('option', {name: change === 'category' ? 'Food' : 'Card'}));
      }
      await waitFor(() =>
        expect(transactionGetAllMock).toHaveBeenLastCalledWith(
          expect.objectContaining({from: 0, to: change === 'pageSize' ? 10 : 25}),
        ),
      );
      const url = new URL(pushMock.mock.lastCall![0], window.location.origin);
      expect(url.searchParams.has('page')).toBe(false);
      expect(url.searchParams.get('pageSize')).toBe(change === 'pageSize' ? null : '25');
      expect(url.searchParams.get('foreign')).toBe('keep');
    },
  );

  it('fetches filter options, the report and transactions after hydration', async () => {
    render(<InsightsReportDashboard />);

    await waitFor(() => expect(categoryValueHelpMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(getReportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          $granularity: 'auto',
          $comparison: 'previous',
          $categories: [],
          $paymentMethods: [],
        }),
      ),
    );
    await waitFor(() => expect(transactionGetAllMock).toHaveBeenCalledWith(expect.objectContaining({from: 0, to: 10})));

    expect(screen.getByText('Net. cash flow')).toBeInTheDocument();
    expect(screen.getByText('Receiver 1')).toBeInTheDocument();
  });

  it('writes the active filters back to the URL when search params are empty', async () => {
    render(<InsightsReportDashboard />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalled());
    const url = replaceMock.mock.calls[0][0] as string;
    expect(url.startsWith('/dashboard/insights?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('granularity')).toBe('auto');
    expect(params.get('comparison')).toBe('previous');
    expect(params.has('cat')).toBe(false);
    expect(params.has('pm')).toBe(false);
  });

  it('restores the initial filters from the URL', async () => {
    navigation.params = new URLSearchParams(
      'from=2026-01-01&to=2026-01-31&granularity=month&comparison=none&cat=cat-1&pm=pm-1',
    );
    render(<InsightsReportDashboard />);

    await waitFor(() =>
      expect(getReportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          $dateFrom: new Date(2026, 0, 1),
          $dateTo: new Date(2026, 0, 31),
          $categories: ['cat-1'],
          $paymentMethods: ['pm-1'],
          $granularity: 'month',
          $comparison: 'none',
        }),
      ),
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('preserves URL calendar days when another report filter changes', async () => {
    navigation.params = new URLSearchParams('from=2026-02-01&to=2026-02-28&granularity=month&comparison=none');
    render(<InsightsReportDashboard />);
    await waitFor(() => expect(screen.getByText('Net. cash flow')).toBeInTheDocument());
    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Grouping'}));
    fireEvent.click(screen.getByRole('option', {name: 'Week'}));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    const url = new URL(pushMock.mock.lastCall![0], window.location.origin);
    expect(url.searchParams.get('from')).toBe('2026-02-01');
    expect(url.searchParams.get('to')).toBe('2026-02-28');
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('refreshes the report when the granularity changes', async () => {
    render(<InsightsReportDashboard />);
    await waitFor(() => expect(screen.getByText('Net. cash flow')).toBeInTheDocument());

    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Grouping'}));
    fireEvent.click(screen.getByRole('option', {name: 'Week'}));

    await waitFor(() =>
      expect(getReportMock).toHaveBeenLastCalledWith(expect.objectContaining({$granularity: 'week'})),
    );
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('granularity=week'), {scroll: false}),
    );
  });

  it('restores report controls and results when the URL changes through history navigation', async () => {
    const {rerender} = render(<InsightsReportDashboard />);
    await waitFor(() => expect(getReportMock).toHaveBeenCalled());
    getReportMock.mockClear();
    navigation.params = new URLSearchParams(
      'from=2026-02-01&to=2026-02-28&granularity=month&comparison=none&page=2&pageSize=25',
    );
    rerender(<InsightsReportDashboard />);

    await waitFor(() =>
      expect(getReportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          $dateFrom: new Date(2026, 1, 1),
          $dateTo: new Date(2026, 1, 28),
          $granularity: 'month',
          $comparison: 'none',
        }),
      ),
    );
    await waitFor(() =>
      expect(transactionGetAllMock).toHaveBeenLastCalledWith(expect.objectContaining({from: 25, to: 50})),
    );
  });

  it('resets the transaction pagination when a category filter is applied', async () => {
    render(<InsightsReportDashboard />);
    await waitFor(() => expect(screen.getByText('Receiver 1')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Go to next page'));
    await waitFor(() =>
      expect(transactionGetAllMock).toHaveBeenCalledWith(expect.objectContaining({from: 10, to: 20})),
    );

    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Categories'}));
    await waitFor(() => expect(screen.getByRole('option', {name: 'Food'})).toBeTruthy());
    fireEvent.click(screen.getByRole('option', {name: 'Food'}));

    await waitFor(() =>
      expect(transactionGetAllMock).toHaveBeenLastCalledWith(
        expect.objectContaining({$categories: ['cat-1'], from: 0, to: 10}),
      ),
    );
    await waitFor(() =>
      expect(getReportMock).toHaveBeenLastCalledWith(expect.objectContaining({$categories: ['cat-1']})),
    );
  });

  it('surfaces report request errors as an alert', async () => {
    getReportMock.mockResolvedValue([null, new Error('Report request failed')]);
    render(<InsightsReportDashboard />);

    expect(await screen.findByText('Report request failed')).toBeInTheDocument();
  });

  it.each(['report', 'transactions'] as const)('handles rejected %s requests and allows retry', async request => {
    const mock = request === 'report' ? getReportMock : transactionGetAllMock;
    mock.mockRejectedValueOnce(new Error('Request rejected'));
    render(<InsightsReportDashboard />);
    expect(await screen.findByText('Request rejected')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: request === 'report' ? 'Retry report' : 'Retry transactions'}));
    expect(await screen.findByText('Receiver 1')).toBeInTheDocument();
    expect(screen.queryByText('Request rejected')).not.toBeInTheDocument();
  });

  it.each(['report', 'transactions'] as const)('ignores rejected stale %s requests after navigation', async request => {
    let rejectPrevious!: (error: Error) => void;
    const mock = request === 'report' ? getReportMock : transactionGetAllMock;
    mock.mockImplementationOnce(() => new Promise((_, reject) => (rejectPrevious = reject)));
    const {rerender} = render(<InsightsReportDashboard />);
    await waitFor(() => expect(mock).toHaveBeenCalled());
    navigation.params = new URLSearchParams('from=2026-02-01&to=2026-02-28&granularity=month&comparison=none');
    rerender(<InsightsReportDashboard />);
    expect(await screen.findByText('Receiver 1')).toBeInTheDocument();
    await act(async () => rejectPrevious(new Error('Old request rejected')));
    expect(screen.queryByText('Old request rejected')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it.each(['tuple', 'rejected'] as const)('preserves selected URL IDs when filter options fail: %s', async failure => {
    navigation.params = new URLSearchParams(
      'from=2026-02-01&to=2026-02-28&granularity=month&comparison=none&cat=cat-1&pm=pm-1',
    );
    if (failure === 'tuple') {
      categoryValueHelpMock.mockResolvedValueOnce([null, new Error('Options unavailable')]);
      paymentMethodValueHelpMock.mockResolvedValueOnce([null, new Error('Options unavailable')]);
    } else categoryValueHelpMock.mockRejectedValueOnce(new Error('Options unavailable'));
    render(<InsightsReportDashboard />);
    expect(await screen.findByText('Options unavailable')).toBeInTheDocument();
    await waitFor(() =>
      expect(getReportMock).toHaveBeenLastCalledWith(
        expect.objectContaining({$categories: ['cat-1'], $paymentMethods: ['pm-1']}),
      ),
    );
    await waitFor(() =>
      expect(transactionGetAllMock).toHaveBeenLastCalledWith(
        expect.objectContaining({$categories: ['cat-1'], $paymentMethods: ['pm-1']}),
      ),
    );
    expect(await screen.findByText('Receiver 1')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Retry filters'}));
    expect(await screen.findByRole('button', {name: 'Food'})).toBeInTheDocument();
    expect(await screen.findByRole('button', {name: 'Card'})).toBeInTheDocument();
    expect(screen.queryByText('Options unavailable')).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Grouping'}));
    fireEvent.click(screen.getByRole('option', {name: 'Week'}));
    const url = new URL(pushMock.mock.lastCall![0], window.location.origin);
    expect(url.searchParams.get('cat')).toBe('cat-1');
    expect(url.searchParams.get('pm')).toBe('pm-1');
  });

  it('changes the transaction page size and fetches the first page with the new size', async () => {
    render(<InsightsReportDashboard />);
    await waitFor(() => expect(screen.getByText('Receiver 1')).toBeInTheDocument());

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.mouseDown(comboboxes[comboboxes.length - 1]);
    fireEvent.click(screen.getByRole('option', {name: '25'}));

    await waitFor(() =>
      expect(transactionGetAllMock).toHaveBeenLastCalledWith(expect.objectContaining({from: 0, to: 25})),
    );
  });
});
