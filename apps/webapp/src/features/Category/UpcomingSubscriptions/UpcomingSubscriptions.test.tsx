import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {useSubscriptions} from '@/features/Subscription';

import {UpcomingSubscriptions} from './UpcomingSubscriptions.component';

vi.mock('@/features/Subscription', () => ({
  useSubscriptions: vi.fn(),
}));

describe('UpcomingSubscriptions', () => {
  const mockSubscriptionsData = {
    isLoading: false,
    data: [],
    getUpcomingSubscriptionPaymentsByCategory: vi.fn().mockReturnValue([
      ['sub1', {category: {name: 'Entertainment'}, total: 9.99}],
      ['sub2', {category: {name: 'Entertainment'}, total: 5.99}],
      ['sub3', {category: {name: 'Utilities'}, total: 49.99}],
    ]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSubscriptions as ReturnType<typeof vi.fn>).mockReturnValue(mockSubscriptionsData);
  });

  it('renders loading state', () => {
    (useSubscriptions as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockSubscriptionsData,
      isLoading: true,
    });

    render(<UpcomingSubscriptions />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders no results message when no subscriptions', () => {
    (useSubscriptions as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockSubscriptionsData,
      getUpcomingSubscriptionPaymentsByCategory: vi.fn().mockReturnValue([]),
    });

    render(<UpcomingSubscriptions />);
    expect(screen.getByText('No upcoming subscriptions for this month!')).toBeInTheDocument();
  });

  it('renders grouped subscriptions correctly', () => {
    render(<UpcomingSubscriptions />);

    expect(screen.getByText('Entertainment')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();

    const entertainmentTotal = screen.getByText('15,98 €');
    const utilitiesTotal = screen.getByText('49,99 €');
    expect(entertainmentTotal).toBeInTheDocument();
    expect(utilitiesTotal).toBeInTheDocument();
  });

  it('displays correct total in subtitle', () => {
    render(<UpcomingSubscriptions />);
    expect(screen.getByText('65,97 € grouped by category')).toBeInTheDocument();
  });
});
