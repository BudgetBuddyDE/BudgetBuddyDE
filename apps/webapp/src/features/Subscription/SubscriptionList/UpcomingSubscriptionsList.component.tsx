import React from 'react';

import {useSubscriptions} from '../useSubscriptions.hook';
import {SubscriptionList, TSubscriptionListProps} from './SubscriptionList.component';

export type TUpcomingSubscriptionsListProps = Pick<TSubscriptionListProps, 'onAddSubscription'>;

/**
 * TODO: Instead of using the `useSubscriptions` hook, we should use the `getUpcomingSubscriptions` function directly which should fetch the subscriptions from the backend.
 */
export const UpcomingSubscriptionsList: React.FC<TUpcomingSubscriptionsListProps> = ({onAddSubscription}) => {
  const {isLoading, data} = useSubscriptions();

  return (
    <SubscriptionList
      isLoading={isLoading}
      title="Subscriptions"
      subtitle="Upcoming recurring payments this month"
      subscriptions={(data ?? []).filter(s => s.executeAt >= new Date().getDate())}
      onAddSubscription={onAddSubscription}
    />
  );
};
