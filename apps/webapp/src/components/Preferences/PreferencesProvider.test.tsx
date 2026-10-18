import type {TPreference} from '@budgetbuddyde/api';
import {act, cleanup, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {Provider} from 'react-redux';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
import {makeStore} from '@/lib/store';
import {
  PreferencesProvider,
  useOptionalPreferencesContext,
  usePreferencesContext,
  type PreferencesContextValue,
} from './PreferencesProvider';

const mocks = vi.hoisted(() => ({
  session: {data: null, isPending: true} as {data: {user: {id: string}} | null; isPending: boolean},
  get: vi.fn(),
  update: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/authClient', () => ({authClient: {useSession: () => mocks.session}}));
vi.mock('@/apiClient', () => ({apiClient: {backend: {preference: {get: mocks.get, update: mocks.update}}}}));
vi.mock('next/navigation', () => ({useRouter: () => ({refresh: mocks.refresh})}));

const initial: TPreference = {
  ownerId: 'alice' as TPreference['ownerId'],
  language: 'de_DE',
  currency: 'USD',
  timeZone: 'America/New_York',
  onboardingCompleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
let context: PreferencesContextValue;
function Consumer() {
  context = usePreferencesContext();
  return (
    <div>
      {context.preferences?.ownerId ?? 'none'}:{context.effectivePreferences.currency}:{context.locale}
    </div>
  );
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return {promise, resolve};
}
const success = (data: TPreference) => [{data}, null] as const;
function setup(data: TPreference | null = initial, error: string | null = null) {
  const store = makeStore();
  const tree = (preferences = data) => (
    <Provider store={store}>
      <PreferencesProvider initialPreferences={preferences} initialError={error}>
        <Consumer />
      </PreferencesProvider>
    </Provider>
  );
  return {...render(tree()), tree, store};
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session = {data: {user: {id: 'alice'}}, isPending: false};
  mocks.get.mockResolvedValue(success(initial));
  mocks.update.mockResolvedValue(success(initial));
});
afterEach(cleanup);

describe('PreferencesProvider', () => {
  it('formats USD on the initial server render and updates both currency consumers after a save', async () => {
    mocks.session = {data: null, isPending: true};
    function CurrencyConsumer({label}: {label: string}) {
      const formatter = useCurrencyFormatter();
      return <output aria-label={label}>{formatter.formatBalance(1234.5)}</output>;
    }
    const store = makeStore();
    const tree = () => (
      <Provider store={store}>
        <PreferencesProvider initialPreferences={initial} initialError={null}>
          <Consumer />
          <CurrencyConsumer label="Account balance" />
          <CurrencyConsumer label="Transaction amount" />
        </PreferencesProvider>
      </Provider>
    );
    const html = renderToString(tree());
    expect(html.match(/\$1,234\.50/g)).toHaveLength(2);
    expect(html).not.toContain('€');
    const view = render(tree());
    expect(screen.getByLabelText('Account balance')).toHaveTextContent('$1,234.50');
    expect(screen.getByLabelText('Transaction amount')).toHaveTextContent('$1,234.50');
    mocks.session = {data: {user: {id: 'alice'}}, isPending: false};
    view.rerender(tree());
    mocks.update.mockResolvedValue(success({...initial, currency: 'EUR'}));
    await act(async () => {
      await context.updatePreferences({currency: 'EUR'});
    });
    expect(screen.getByLabelText('Account balance')).toHaveTextContent('€1,234.50');
    expect(screen.getByLabelText('Transaction amount')).toHaveTextContent('€1,234.50');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('exposes initial server data during SSR and pending client auth', () => {
    mocks.session = {data: null, isPending: true};
    const html = renderToString(
      <Provider store={makeStore()}>
        <PreferencesProvider initialPreferences={initial} initialError={null}>
          <Consumer />
        </PreferencesProvider>
      </Provider>,
    );
    expect(html).toContain('alice');
    expect(html).toContain('USD');
    expect(context.preferences).toEqual(initial);
    expect(context.effectivePreferences).toEqual({language: 'en_US', currency: 'USD', timeZone: 'Europe/Berlin'});
    setup();
    expect(screen.getByText('alice:USD:en-US')).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('refreshes server components after saving and ignores older reloads and props', async () => {
    const request = deferred<ReturnType<typeof success>>();
    mocks.get.mockReturnValue(request.promise);
    const view = setup();
    let loading!: Promise<void>;
    act(() => {
      loading = context.reloadPreferences();
    });
    mocks.update.mockResolvedValue(success({...initial, currency: 'EUR'}));
    await act(async () => {
      await context.updatePreferences({currency: 'EUR'});
    });
    await act(async () => {
      request.resolve(success(initial));
      await loading;
    });
    view.rerender(view.tree({...initial}));
    expect(context.preferences?.currency).toBe('EUR');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('isolates account switches without briefly exposing the old account', async () => {
    const request = deferred<ReturnType<typeof success>>();
    mocks.get.mockReturnValue(request.promise);
    const view = setup();
    mocks.session = {data: {user: {id: 'bob'}}, isPending: false};
    view.rerender(view.tree());
    expect(context.preferences).toBeNull();
    expect(mocks.get).toHaveBeenCalledOnce();
    await act(async () => {
      request.resolve(success({...initial, ownerId: 'bob' as TPreference['ownerId'], currency: 'EUR'}));
    });
    expect(context.preferences?.ownerId).toBe('bob');
    mocks.session = {data: null, isPending: false};
    view.rerender(view.tree());
    expect(context.preferences).toBeNull();
  });

  it('discards a save completing after logout and allows a new account to load', async () => {
    const request = deferred<ReturnType<typeof success>>();
    mocks.update.mockReturnValue(request.promise);
    const view = setup();
    let saving!: Promise<void>;
    act(() => {
      saving = context.updatePreferences({currency: 'EUR'});
    });
    const rejected = expect(saving).rejects.toThrow('session changed');
    mocks.session = {data: null, isPending: false};
    view.rerender(view.tree());
    await act(async () => {
      request.resolve(success(initial));
      await rejected;
    });
    expect(context.preferences).toBeNull();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(view.store.getState().preferences.isSaving).toBe(false);
  });

  it('preserves initial errors, retries explicitly, and handles thrown save errors', async () => {
    setup(null, 'offline');
    expect(context.error).toBe('offline');
    expect(mocks.get).not.toHaveBeenCalled();
    await act(async () => {
      await context.reloadPreferences();
    });
    expect(context.preferences).toEqual(initial);
    mocks.update.mockRejectedValue(new Error('save failed'));
    await act(async () => {
      await expect(context.updatePreferences({currency: 'EUR'})).rejects.toThrow('save failed');
    });
    expect(context.isSaving).toBe(false);
    expect(context.preferences).toEqual(initial);
    expect(context.error).toBe('save failed');
  });

  it('offers an optional context outside the authenticated provider', () => {
    function PublicConsumer() {
      return <span>{useOptionalPreferencesContext() === null ? 'public' : 'authenticated'}</span>;
    }
    render(<PublicConsumer />);
    expect(screen.getByText('public')).toBeInTheDocument();
  });

  it('does not reuse stale server props when signing back into the same account', async () => {
    const view = setup();
    mocks.session = {data: null, isPending: false};
    view.rerender(view.tree());
    const request = deferred<ReturnType<typeof success>>();
    mocks.get.mockReturnValue(request.promise);
    mocks.session = {data: {user: {id: 'alice'}}, isPending: false};
    view.rerender(view.tree());
    expect(context.preferences).toBeNull();
    expect(mocks.get).toHaveBeenCalledOnce();
    await act(async () => {
      request.resolve(success({...initial, currency: 'EUR'}));
    });
    expect(context.preferences?.currency).toBe('EUR');
  });

  it('defers requests while auth is pending and serializes saves against reloads', async () => {
    mocks.session = {data: null, isPending: true};
    const view = setup();
    await act(async () => {
      await context.reloadPreferences();
      await expect(context.updatePreferences({currency: 'EUR'})).rejects.toThrow('Sign in');
    });
    expect(mocks.get).not.toHaveBeenCalled();
    mocks.session = {data: {user: {id: 'alice'}}, isPending: false};
    view.rerender(view.tree());
    const request = deferred<ReturnType<typeof success>>();
    mocks.update.mockReturnValue(request.promise);
    let saving!: Promise<void>;
    act(() => {
      saving = context.updatePreferences({currency: 'EUR'});
    });
    await act(async () => {
      await context.reloadPreferences();
      await expect(context.updatePreferences({currency: 'EUR'})).rejects.toThrow('already being saved');
    });
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledOnce();
    await act(async () => {
      request.resolve(success({...initial, currency: 'EUR'}));
      await saving;
    });
  });
});
