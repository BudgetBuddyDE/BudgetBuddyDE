import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {CategoryDialog} from './category-dialog';

const mocks = vi.hoisted(() => ({
  saveCategory: vi.fn(),
  categoryToDraft: vi.fn(() => ({
    name: '',
    type: 'expense',
    color: '#64748b',
    icon: 'circle',
    budgetTarget: '',
    description: '',
  })),
}));
vi.mock('@/lib/category-mutations', () => ({saveCategory: mocks.saveCategory, categoryToDraft: mocks.categoryToDraft}));

describe('CategoryDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('captures category metadata and closes after success', async () => {
    mocks.saveCategory.mockResolvedValue({success: true});
    const onOpenChange = vi.fn();
    const onSaved = vi.fn();
    render(<CategoryDialog open onOpenChange={onOpenChange} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText('Category name'), {target: {value: 'Food'}});
    fireEvent.change(screen.getByLabelText('Category type'), {target: {value: 'both'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save category'}));
    await waitFor(() =>
      expect(mocks.saveCategory).toHaveBeenCalledWith(expect.objectContaining({name: 'Food', type: 'both'}), undefined),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSaved).toHaveBeenCalled();
  });

  it('keeps validation and service errors visible', async () => {
    mocks.saveCategory.mockResolvedValue({success: false, error: 'Enter a category name.'});
    render(<CategoryDialog open onOpenChange={() => undefined} onSaved={() => undefined} />);
    fireEvent.click(screen.getByRole('button', {name: 'Save category'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a category name');
  });
});
