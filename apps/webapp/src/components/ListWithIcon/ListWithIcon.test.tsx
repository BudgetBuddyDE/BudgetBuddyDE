import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {ListWithIcon} from './ListWithIcon';

describe('ListWithIcon', () => {
  it('renders the title', () => {
    render(<ListWithIcon title="Groceries" />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('renders a string subtitle', () => {
    render(<ListWithIcon title="Rent" subtitle="Monthly expense" />);
    expect(screen.getByText('Monthly expense')).toBeInTheDocument();
  });

  it('renders an array subtitle as chips', () => {
    render(<ListWithIcon title="Tags" subtitle={['Food', 'Daily']} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('renders a ReactNode subtitle', () => {
    render(<ListWithIcon title="Custom" subtitle={<span data-testid="node-subtitle">Custom node</span>} />);
    expect(screen.getByTestId('node-subtitle')).toBeInTheDocument();
  });

  it('renders a string amount', () => {
    render(<ListWithIcon title="Salary" amount="€2,000.00" />);
    expect(screen.getByText('€2,000.00')).toBeInTheDocument();
  });

  it('renders a ReactNode amount', () => {
    render(<ListWithIcon title="Balance" amount={<span data-testid="amount-node">+€500</span>} />);
    expect(screen.getByTestId('amount-node')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    render(<ListWithIcon title="Category" icon={<span data-testid="test-icon">★</span>} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('calls onClick when the item is clicked', () => {
    const onClick = vi.fn();
    render(<ListWithIcon title="Clickable item" onClick={onClick} />);
    fireEvent.click(screen.getByText('Clickable item'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders without crashing when only title is given', () => {
    const {container} = render(<ListWithIcon title="Minimal" />);
    expect(container).not.toBeEmptyDOMElement();
  });
});
