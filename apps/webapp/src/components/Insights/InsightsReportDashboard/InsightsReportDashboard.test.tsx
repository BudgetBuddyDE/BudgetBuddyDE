import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {buildReport, buildTransaction, categoryOption, paymentMethodOption} from '../InsightsReport.fixtures';
import {InsightsReportDashboard} from './InsightsReportDashboard';

const {
  getReportMock,
  transactionGetAllMock,
  categoryValueHelpMock,
  paymentMethodValueHelpMock,
  replaceMock,
  navigation,
} = vi.hoisted(() => ({
  getReportMock: vi.fn(),
  transactionGetAllMock: vi.fn(),
  categoryValueHelpMock: vi.fn(),
  paymentMethodValueHelpMock: vi.fn(),
  replaceMock: vi.fn(),
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
  useRouter: () => ({replace: replaceMock}),
  usePathname: () => '/dashboard/insights',
}));

vi.mock('@/components/Charts', () => ({
  BarLineChart: () => <div>timeline chart</div>,
}));

vi.mock('@/components/Form/DateRangePicker', () => ({
  DateRangePicker: () => <div>date range</div>,
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
  categoryValueHelpMock.mockResolvedValue([categories, null]);
  paymentMethodValueHelpMock.mockResolvedValue([paymentMethods, null]);
  getReportMock.mockResolvedValue([{data: report}, null]);
  transactionGetAllMock.mockResolvedValue([{data: transactions, totalCount: 12}, null]);
});

afterEach(() => cleanup());

describe('InsightsReportDashboard', () => {
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
          $dateFrom: new Date('2026-01-01T00:00:00.000Z'),
          $dateTo: new Date('2026-01-31T00:00:00.000Z'),
          $categories: ['cat-1'],
          $paymentMethods: ['pm-1'],
          $granularity: 'month',
          $comparison: 'none',
        }),
      ),
    );
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
      expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining('granularity=week'), {scroll: false}),
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
