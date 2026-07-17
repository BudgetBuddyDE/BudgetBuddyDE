import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BudgetDialog} from './budget-dialog';

const mocks = vi.hoisted(() => ({save: vi.fn()}));
vi.mock('@/lib/budget-mutations', () => ({
  budgetToDraft: () => ({
    name: '',
    type: 'e',
    amount: '',
    period: '2026-07',
    warningThreshold: '80',
    categoryIds: [],
    description: '',
  }),
  saveBudget: mocks.save,
}));
const category = {id: 'cat', name: 'Food'} as never;

describe('BudgetDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits period, threshold, and selected categories', async () => {
    mocks.save.mockResolvedValue({success: true});
    const onSaved = vi.fn();
    render(<BudgetDialog open onOpenChange={() => undefined} categories={[category]} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText('Budget name'), {target: {value: 'Food budget'}});
    fireEvent.click(screen.getByLabelText('Budget category Food'));
    fireEvent.click(screen.getByRole('button', {name: 'Save budget'}));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        expect.objectContaining({name: 'Food budget', categoryIds: ['cat'], period: '2026-07'}),
        undefined,
      ),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows form errors', async () => {
    mocks.save.mockResolvedValue({success: false, error: 'Enter a budget name.'});
    render(<BudgetDialog open onOpenChange={() => undefined} categories={[]} onSaved={() => undefined} />);
    fireEvent.click(screen.getByRole('button', {name: 'Save budget'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('budget name');
  });
});
