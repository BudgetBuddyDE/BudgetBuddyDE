import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {CategoryChip} from './CategoryChip';

describe('CategoryChip', () => {
  it('renders the category name as the chip label', () => {
    render(<CategoryChip categoryName="Food" />);
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('renders with outlined variant by default', () => {
    render(<CategoryChip categoryName="Travel" data-testid="chip" />);
    expect(screen.getByTestId('chip')).toBeInTheDocument();
  });

  it('forwards additional chip props', () => {
    render(<CategoryChip categoryName="Housing" data-testid="housing-chip" />);
    expect(screen.getByTestId('housing-chip')).toBeInTheDocument();
  });

  it('renders with different category names', () => {
    const {rerender} = render(<CategoryChip categoryName="Income" />);
    expect(screen.getByText('Income')).toBeInTheDocument();

    rerender(<CategoryChip categoryName="Expense" />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });
});
