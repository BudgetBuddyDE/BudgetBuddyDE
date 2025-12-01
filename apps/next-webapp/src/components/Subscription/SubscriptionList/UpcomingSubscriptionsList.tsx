import type React from "react";
import { headers } from "@/lib/headers";
import { RecurringPaymentService } from "@/services/RecurringPayment.service";
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
	const [subscriptions, error] = await new RecurringPaymentService().getAll(
		{
			to: 6,
			$executeFrom: new Date().getDate(),
		},
		{ headers: await headers() },
	);
	if (error) throw error;

	const now = new Date()
	return (
		<SubscriptionList
			title="Upcoming Subscriptions"
			subtitle="Your upcoming subscriptions"
			data={(subscriptions.data ?? []).map((t) => ({
				ID: t.id,
				receiver: t.receiver,
				nextExecution: new Date(now.getFullYear(), now.getMonth(), t.executeAt),
				transferAmount: t.transferAmount,
				category: {
					ID: t.category.id,
					name: t.category.name,
				},
				paymentMethod: {
					ID: t.paymentMethod.id,
					name: t.paymentMethod.name,
				},
			}))}
			onAddEntity={onAddEntity}
			noResultsMessage="You don't have any upcoming subscriptions for this month"
		/>
	);
};
