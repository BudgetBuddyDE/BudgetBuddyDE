import {render, waitFor} from '@testing-library/react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {IntentHandlers} from './useConsumeIntent';
import {useConsumeIntent} from './useConsumeIntent';

const replace = vi.fn();
const push = vi.fn();

const Harness: React.FC<{handlers: IntentHandlers}> = ({handlers}) => {
  useConsumeIntent('transaction', handlers);
  return null;
};

describe('useConsumeIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue('/transactions');
    vi.mocked(useRouter).mockReturnValue({push, replace, back: vi.fn()} as never);
  });

  it('calls onCreate once and strips only IBN params', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('q=food&ibnEntity=transaction&ibnAction=create') as never,
    );
    const onCreate = vi.fn();

    const {rerender} = render(<Harness handlers={{onCreate}} />);
    rerender(<Harness handlers={{onCreate}} />);

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith('/transactions?q=food');
  });

  it('calls onEdit with the provided ID', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('ibnEntity=transaction&ibnAction=edit&ibnId=tx-1') as never,
    );
    const onEdit = vi.fn();

    render(<Harness handlers={{onEdit}} />);

    await waitFor(() => expect(onEdit).toHaveBeenCalledWith('tx-1'));
    expect(replace).toHaveBeenCalledWith('/transactions');
  });

  it('calls onInvalid and removes IBN keys for invalid intents', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('q=food&ibnEntity=transaction&ibnAction=edit') as never,
    );
    const onInvalid = vi.fn();

    render(<Harness handlers={{onInvalid}} />);

    await waitFor(() => expect(onInvalid).toHaveBeenCalledWith('edit intent requires ID'));
    expect(replace).toHaveBeenCalledWith('/transactions?q=food');
  });

  it('ignores a foreign entity on the same page', async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('ibnEntity=category&ibnAction=create') as never);
    const onCreate = vi.fn();
    const onInvalid = vi.fn();

    render(<Harness handlers={{onCreate, onInvalid}} />);

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(onCreate).not.toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
