
import type React from "react";
import { headers } from "@/lib/headers";
import { SubscriptionService } from "@/services/Subscription.service";
import {
	SubscriptionList,
	type SubscriptionListProps,
} from "./SubscriptionList";

export type UpcomingSubscriptionsList = Pick<
	SubscriptionListProps,
	"onAddEntity"
>;

export const UpcomingSubscriptionsList: React.FC<
	UpcomingSubscriptionsList
> = async ({ onAddEntity }) => {
	const [subscriptions, error] = await SubscriptionService.getSubscriptions(
		{
			$filter: `executeAt ge ${new Date().getDate()}`,
			$top: 6,
		},
		{ headers: await headers() },
	);
	if (error) throw error;

	return (
		<SubscriptionList
			title="Upcoming Subscriptions"
			subtitle="Your upcoming subscriptions"
			data={subscriptions.map((t) => ({
				ID: t.ID,
				receiver: t.receiver,
				nextExecution: t.nextExecution,
				transferAmount: t.transferAmount,
				category: {
					ID: t.toCategory.ID,
					name: t.toCategory.name,
				},
				paymentMethod: {
					ID: t.toPaymentMethod.ID,
					name: t.toPaymentMethod.name,
				},
			}))}
			onAddEntity={onAddEntity}
			noResultsMessage="You don't have any upcoming subscriptions for this month"
		/>
	);
};
