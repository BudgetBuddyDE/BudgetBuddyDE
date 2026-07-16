import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {PageHeader, SkeletonRows, StatePanel} from './shared';

describe('shared feedback components', () => {
  it('renders page context and an optional action', () => {
    render(
      <PageHeader
        eyebrow="Finance"
        title="Transactions"
        description="Manage money movements."
        action={<button>Add</button>}
      />,
    );
    expect(screen.getByRole('heading', {name: 'Transactions'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Add'})).toBeVisible();
  });

  it('announces errors and retries the operation', async () => {
    const retry = vi.fn();
    render(<StatePanel state="error" title="Unavailable" description="Try again." onRetry={retry} />);
    expect(screen.getByRole('alert')).toHaveAccessibleName('');
    await userEvent.click(screen.getByRole('button', {name: /retry/i}));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('renders a deterministic number of skeleton rows', () => {
    render(<SkeletonRows count={3} />);
    expect(screen.getByLabelText('Loading content').children).toHaveLength(3);
  });
});
