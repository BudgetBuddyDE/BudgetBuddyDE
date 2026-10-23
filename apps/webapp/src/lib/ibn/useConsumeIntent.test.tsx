import {act, render, waitFor} from '@testing-library/react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vite-plus/test';
import {registerPageTransition} from '../viewTransitions';
import type {IntentHandlers} from './useConsumeIntent';
import {useConsumeIntent} from './useConsumeIntent';

const Harness: React.FC<{handlers: IntentHandlers}> = ({handlers}) => {
  useConsumeIntent('transaction', handlers);
  return null;
};

const setParams = (query = 'ibnEntity=transaction&ibnAction=create') => {
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as never);
};

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useConsumeIntent', () => {
  const finishes: Array<() => void> = [];
  const startPageTransition = () => {
    const finish = registerPageTransition();
    finishes.push(finish);
    return finish;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue('/transactions');
    setParams();
    window.history.replaceState(null, '', '/transactions');
  });

  afterEach(() => {
    finishes.splice(0).forEach(finish => finish());
    vi.restoreAllMocks();
  });

  it('calls onCreate once and preserves unrelated parameters, hash and history state', async () => {
    setParams('q=food&ibnEntity=transaction&ibnAction=create');
    const state = {__NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ['transactions'], custom: 'preserve'};
    window.history.replaceState(state, '', '/transactions?q=food&ibnEntity=transaction&ibnAction=create#details');
    const nativeReplace = window.history.replaceState.bind(window.history);
    const synchronizeRouter = vi.fn();
    const replace = vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) => {
      // Next only synchronizes useSearchParams for external history updates.
      if (data?.__NA || data?._N) {
        nativeReplace(data, unused, url);
        return;
      }
      synchronizeRouter();
      setParams(new URL(String(url), window.location.href).search.slice(1));
      nativeReplace(
        {
          ...data,
          __NA: window.history.state.__NA,
          __PRIVATE_NEXTJS_INTERNALS_TREE: window.history.state.__PRIVATE_NEXTJS_INTERNALS_TREE,
        },
        unused,
        url,
      );
    });
    const router = vi.mocked(useRouter)();
    const onCreate = vi.fn();

    const {rerender} = render(<Harness handlers={{onCreate}} />);
    rerender(<Harness handlers={{onCreate}} />);

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        {__PRIVATE_NEXTJS_INTERNALS_TREE: ['transactions'], custom: 'preserve'},
        '',
        '/transactions?q=food#details',
      ),
    );
    expect(synchronizeRouter).toHaveBeenCalledOnce();
    expect(window.history.state).toEqual(state);
    expect(router.replace).not.toHaveBeenCalled();

    // Observe the cleaned query, then navigate to the same intent again.
    rerender(<Harness handlers={{onCreate}} />);
    setParams('q=food&ibnEntity=transaction&ibnAction=create');
    rerender(<Harness handlers={{onCreate}} />);
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(2));
  });

  it('waits until the page transition finishes before opening the drawer', async () => {
    const finish = startPageTransition();
    const onCreate = vi.fn();
    render(<Harness handlers={{onCreate}} />);
    await flushEffects();
    expect(onCreate).not.toHaveBeenCalled();

    await act(async () => finish());

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
  });

  it('waits for chained transitions before opening the drawer', async () => {
    const finishFirst = startPageTransition();
    const onCreate = vi.fn();
    render(<Harness handlers={{onCreate}} />);
    await flushEffects();
    const finishSecond = startPageTransition();
    await act(async () => finishFirst());
    expect(onCreate).not.toHaveBeenCalled();

    await act(async () => finishSecond());

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
  });

  it('consumes the intent once under StrictMode effect replay', async () => {
    const finish = startPageTransition();
    const onCreate = vi.fn();
    render(
      <React.StrictMode>
        <Harness handlers={{onCreate}} />
      </React.StrictMode>,
    );
    await act(async () => finish());
    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
  });

  it('does not open a drawer after unmounting while waiting', async () => {
    const finish = startPageTransition();
    const onCreate = vi.fn();
    const {unmount} = render(<Harness handlers={{onCreate}} />);
    await flushEffects();
    unmount();
    await act(async () => finish());
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('does not consume an obsolete intent after navigating away while waiting', async () => {
    const finish = startPageTransition();
    const onCreate = vi.fn();
    const {rerender} = render(<Harness handlers={{onCreate}} />);
    await flushEffects();
    vi.mocked(usePathname).mockReturnValue('/categories');
    setParams('');
    rerender(<Harness handlers={{onCreate}} />);
    await act(async () => finish());
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('consumes only the latest intent when it changes during a transition', async () => {
    const finish = startPageTransition();
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const {rerender} = render(<Harness handlers={{onCreate, onEdit}} />);
    await flushEffects();
    setParams('ibnEntity=transaction&ibnAction=edit&ibnId=tx-2');
    rerender(<Harness handlers={{onCreate, onEdit}} />);
    await act(async () => finish());
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith('tx-2'));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('does not replace the URL after an async intent handler is cancelled', async () => {
    setParams('q=food&ibnEntity=transaction&ibnAction=edit&ibnId=tx-1');
    const replace = vi.spyOn(window.history, 'replaceState');
    let finish: (() => void) | undefined;
    const onEdit = vi.fn(() => new Promise<void>(resolve => (finish = resolve)));
    const {unmount} = render(<Harness handlers={{onEdit}} />);
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith('tx-1'));
    unmount();
    await act(async () => finish?.());
    expect(replace).not.toHaveBeenCalled();
  });

  it('calls onInvalid and removes IBN keys for invalid intents', async () => {
    setParams('q=food&ibnEntity=transaction&ibnAction=edit');
    const replace = vi.spyOn(window.history, 'replaceState');
    const onInvalid = vi.fn();
    render(<Harness handlers={{onInvalid}} />);
    await waitFor(() => expect(onInvalid).toHaveBeenCalledWith('edit intent requires ID'));
    expect(replace).toHaveBeenCalledWith({}, '', '/transactions?q=food');
  });

  it('reports handler failures and removes only intent parameters', async () => {
    setParams('q=food&ibnEntity=transaction&ibnAction=edit&ibnId=tx-1');
    const onEdit = vi.fn().mockRejectedValue(new Error('Cannot load transaction'));
    const onInvalid = vi.fn();
    const replace = vi.spyOn(window.history, 'replaceState');
    render(<Harness handlers={{onEdit, onInvalid}} />);
    await waitFor(() => expect(onInvalid).toHaveBeenCalledWith('Cannot load transaction'));
    expect(replace).toHaveBeenCalledWith({}, '', '/transactions?q=food');
  });

  it('ignores a foreign entity on the same page', async () => {
    setParams('ibnEntity=category&ibnAction=create');
    const onCreate = vi.fn();
    const onInvalid = vi.fn();
    const replace = vi.spyOn(window.history, 'replaceState');
    render(<Harness handlers={{onCreate, onInvalid}} />);
    await flushEffects();
    expect(onCreate).not.toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
