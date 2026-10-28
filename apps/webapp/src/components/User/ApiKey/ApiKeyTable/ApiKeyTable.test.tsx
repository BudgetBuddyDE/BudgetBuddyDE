import type {PropsWithChildren} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vite-plus/test';
import {appConfig} from '@/appConfig';
import {fireEvent, render, screen, waitFor, within} from '@/test/testing-library';
import {Formatter} from '@/utils/Formatter';
import {ApiKeyTable} from './ApiKeyTable';
import type {ApiKey} from '../types';

const mocks = vi.hoisted(() => ({
  listApiKeys: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock('@/authClient', () => ({
  authClient: {
    apiKey: {
      list: mocks.listApiKeys,
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/components/Snackbar', () => ({
  useSnackbarContext: () => ({showSnackbar: mocks.showSnackbar}),
}));

vi.mock('@/lib/ibn', () => ({useConsumeIntent: vi.fn()}));
vi.mock('@/components/FAB', () => ({AddFab: () => null, FabContainer: ({children}: PropsWithChildren) => children}));
vi.mock('../ApiKeyCreateDrawer', () => ({ApiKeyCreateDrawer: () => null}));
vi.mock('../ApiKeyDeleteDialog', () => ({ApiKeyDeleteDialog: () => null}));
vi.mock('../CreatedApiKeyDialog', () => ({CreatedApiKeyDialog: () => null}));

const makeApiKey = (overrides: Partial<ApiKey> = {}): ApiKey =>
  ({
    id: 'key-1',
    configId: 'default',
    name: 'Active key',
    start: 'bb-visible-prefix',
    prefix: 'bb-',
    key: 'hashed-key-value',
    referenceId: 'user-1',
    refillInterval: null,
    refillAmount: null,
    lastRefillAt: null,
    enabled: true,
    rateLimitEnabled: true,
    rateLimitTimeWindow: 60_000,
    rateLimitMax: 100,
    requestCount: 5,
    remaining: 95,
    lastRequest: new Date('2026-10-11T10:30:00.000Z'),
    expiresAt: null,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    updatedAt: new Date('2026-10-11T10:00:00.000Z'),
    metadata: null,
    ...overrides,
  }) as ApiKey;

describe('ApiKeyTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listApiKeys.mockResolvedValue({
      data: {
        apiKeys: [
          makeApiKey(),
          makeApiKey({
            id: 'key-2',
            name: 'Expired key',
            start: 'bb-expired',
            enabled: false,
            expiresAt: new Date('2026-10-01T10:00:00.000Z'),
            createdAt: new Date('2026-10-10T10:00:00.000Z'),
          }),
        ],
        total: 2,
      },
      error: null,
    });
  });

  it('shows the key summary and safe key prefix, and expands key details', async () => {
    render(<ApiKeyTable />);

    expect(await screen.findByText('Active key')).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'API keys'})).toBeInTheDocument();
    expect(screen.queryByLabelText('2 API keys')).not.toBeInTheDocument();
    expect(screen.getByText('bb-visible-prefix...')).toBeInTheDocument();
    expect(screen.getByText('Active keys')).toBeInTheDocument();
    expect(screen.getByText('Disabled / expired')).toBeInTheDocument();
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    fireEvent.mouseOver(screen.getByText('1 hour ago'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      Formatter.date.format(new Date(Date.now() - 60 * 60 * 1000)),
    );
    expect(screen.queryByText('hashed-key-value')).not.toBeInTheDocument();

    const detailsButton = screen.getByRole('button', {name: 'Show details for API key Active key'});
    fireEvent.click(detailsButton);

    await waitFor(() => expect(detailsButton).toHaveAttribute('aria-expanded', 'true'));

    const detailsPanel = document.getElementById(detailsButton.getAttribute('aria-controls')!)!;
    expect(within(detailsPanel).getByText('5 requests')).toBeInTheDocument();
    expect(within(detailsPanel).getByText('95 remaining')).toBeInTheDocument();
    expect(within(detailsPanel).getByText('100/1m')).toBeInTheDocument();
  });

  it('renders dividers for both layouts in the grid outside the statistics', async () => {
    render(<ApiKeyTable />);

    await screen.findByText('Active key');

    ['Disabled / expired', 'Last created'].forEach(label => {
      const statistic = screen.getByText(label).parentElement!;
      const dividers = within(statistic.parentElement!).getAllByRole('separator', {hidden: true});
      expect(dividers).toHaveLength(label === 'Last created' ? 2 : 1);
      expect(dividers.filter(divider => divider.getAttribute('aria-orientation') === 'vertical')).toHaveLength(1);
      dividers.forEach(divider => expect(statistic).not.toContainElement(divider));
    });
  });

  it('keeps client-side pagination while loading the complete list for the summary', async () => {
    const apiKeys = Array.from({length: appConfig.tables.itemPerPage + 1}, (_, index) =>
      makeApiKey({id: `key-${index}`, name: `API key ${index}`, start: `bb-${index}`}),
    );
    mocks.listApiKeys.mockResolvedValue({data: {apiKeys, total: apiKeys.length}, error: null});

    render(<ApiKeyTable />);

    expect(await screen.findByText('API key 0')).toBeInTheDocument();
    expect(screen.queryByText(`API key ${appConfig.tables.itemPerPage}`)).not.toBeInTheDocument();
    expect(mocks.listApiKeys).toHaveBeenCalledWith({query: {sortBy: 'createdAt', sortDirection: 'desc'}});

    fireEvent.click(screen.getByRole('button', {name: 'Go to next page'}));

    expect(await screen.findByText(`API key ${appConfig.tables.itemPerPage}`)).toBeInTheDocument();
    expect(screen.queryByText('API key 0')).not.toBeInTheDocument();
  });
});
