import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {StatsCard} from './StatsCard';

describe('StatsCard', () => {
  it('renders the label', () => {
    render(<StatsCard label="Total Balance" value="€1,234.56" />);
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
  });

  it('renders the value', () => {
    render(<StatsCard label="Income" value="€500.00" />);
    expect(screen.getByText('€500.00')).toBeInTheDocument();
  });

  it('renders the valueInformation when provided', () => {
    render(<StatsCard label="Expenses" value="€300.00" valueInformation="Last 30 days" />);
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('does not render valueInformation when not provided', () => {
    render(<StatsCard label="Balance" value="€100.00" />);
    expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument();
  });

  it('renders a skeleton for value when isLoading is true', () => {
    render(<StatsCard label="Balance" value="€100.00" isLoading />);
    // Skeleton replaces the value text
    expect(screen.queryByText('€100.00')).not.toBeInTheDocument();
  });

  it('renders the value when isLoading is false', () => {
    render(<StatsCard label="Balance" value="€100.00" isLoading={false} />);
    expect(screen.getByText('€100.00')).toBeInTheDocument();
  });

  it('renders a custom icon when provided', () => {
    render(<StatsCard label="Balance" value="€100.00" icon={<span data-testid="custom-icon">★</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders without crashing when no icon is provided', () => {
    const {container} = render(<StatsCard label="Test" value="0" />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('renders numeric label', () => {
    render(<StatsCard label={42} value="€0.00" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
