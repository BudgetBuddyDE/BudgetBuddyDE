import type React from "react";
import { headers } from "@/lib/headers";
import { Backend } from "@/services/Backend";
import {
	RecurringPaymentList,
	type RecurringPaymentListProps,
} from "./RecurringPaymentList";

export type UpcomingRecurringPaymentList = Pick<
	RecurringPaymentListProps,
	"onAddEntity"
>;

export const UpcomingRecurringPaymentList: React.FC<
	UpcomingRecurringPaymentList
> = async ({ onAddEntity }) => {
	const [recurringPayments, error] = await Backend.recurringPayment.getAll(
		{
			to: 6,
			$executeFrom: new Date().getDate(),
		},
		{ headers: await headers() },
	);
	if (error) throw error;

	return (
		<RecurringPaymentList
			title="Upcoming recurring payments"
			subtitle="Your upcoming recurring payments"
			data={(recurringPayments.data ?? []).map((t) => ({
				ID: t.id,
				receiver: t.receiver,
				nextExecution: Backend.recurringPayment.determineNextExecutionDate(
					t.executeAt,
				),
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
			noResultsMessage="You don't have any upcoming recurring payments for this month"
		/>
	);
};
