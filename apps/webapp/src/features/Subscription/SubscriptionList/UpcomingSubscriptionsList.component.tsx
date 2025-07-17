import React from 'react';

import {useSubscriptions} from '../useSubscriptions.hook';
import {SubscriptionList, type TSubscriptionListProps} from './SubscriptionList.component';

export type TUpcomingSubscriptionsListProps = Pick<TSubscriptionListProps, 'onAddEntity'>;

/**
 * TODO: Instead of using the `useSubscriptions` hook, we should use the `getUpcomingSubscriptions` function directly which should fetch the subscriptions from the backend.
 */
export const UpcomingSubscriptionsList: React.FC<TUpcomingSubscriptionsListProps> = ({onAddEntity}) => {
  const {isLoading, data} = useSubscriptions();
  return (
    <SubscriptionList
      isLoading={isLoading}
      title="Subscriptions"
      subtitle="Upcoming recurring payments this month"
      data={(data ?? []).filter(s => s.executeAt >= new Date().getDate())}
      onAddEntity={onAddEntity}
      noResultsMessage="You have no upcoming subscriptions for this month"
    />
  );
};
