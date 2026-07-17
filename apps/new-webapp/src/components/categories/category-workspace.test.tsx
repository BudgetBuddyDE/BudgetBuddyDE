import type {TCategory} from '@budgetbuddyde/api/category';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {CategoryWorkspace} from './category-workspace';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  inspect: vi.fn(),
  remove: vi.fn(),
  merge: vi.fn(),
  save: vi.fn(),
}));
vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push, refresh: mocks.refresh})}));
vi.mock('@/lib/category-mutations', () => ({
  categoryToDraft: () => ({
    name: '',
    type: 'expense',
    color: '#64748b',
    icon: 'circle',
    budgetTarget: '',
    description: '',
  }),
  saveCategory: mocks.save,
  inspectCategoryImpact: mocks.inspect,
  deleteCategory: mocks.remove,
  mergeCategories: mocks.merge,
}));

const categories = [
  {
    id: 'cat-1',
    name: 'Food',
    type: 'expense',
    color: '#112233',
    icon: 'utensils',
    budgetTarget: 300,
    description: 'Groceries',
  },
  {id: 'cat-2', name: 'General', type: 'both', color: '#445566', icon: 'circle', budgetTarget: null, description: null},
] as unknown as TCategory[];
const props = {initialCategories: categories, totalCount: 2, search: '', page: 1, pageSize: 25};

describe('CategoryWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows category type, visual identity, budget distinction, and URL search', () => {
    render(<CategoryWorkspace {...props} />);
    expect(screen.getAllByText('Food').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No target').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Search categories'), {target: {value: 'food'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Search'}).closest('form')!);
    expect(mocks.push).toHaveBeenCalledWith('/categories?search=food');
  });

  it('inspects relationships and blocks destructive deletion when used', async () => {
    mocks.inspect.mockResolvedValue({transactions: 4, recurringPayments: 1});
    render(<CategoryWorkspace {...props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Delete Food'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('4 transaction(s) and 1 recurring payment(s)');
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('merges selected categories only after an explicit target', async () => {
    mocks.merge.mockResolvedValue(true);
    render(<CategoryWorkspace {...props} />);
    fireEvent.click(screen.getByLabelText('Select row cat-1'));
    fireEvent.click(screen.getByRole('button', {name: 'Merge selected (1)'}));
    fireEvent.change(await screen.findByLabelText('Target category'), {target: {value: 'cat-2'}});
    fireEvent.click(screen.getByRole('button', {name: 'Merge categories'}));
    await waitFor(() => expect(mocks.merge).toHaveBeenCalledWith(['cat-1'], 'cat-2'));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('renders a recoverable error state', () => {
    render(<CategoryWorkspace {...props} error="Failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Categories unavailable');
  });
});
