import { addDays } from "date-fns";
import type React from "react";
import { headers } from "@/lib/headers";
import { _TransactionService } from "@/services/Transaction.service";
import { TransactionList, type TransactionListProps } from "./TransactionList";

export type UpcomingTransactionsList = Pick<
	TransactionListProps,
	"onAddEntity"
>;

export const UpcomingTransactionsList: React.FC<
	UpcomingTransactionsList
> = async ({ onAddEntity }) => {
	const [transactions, error] = await new _TransactionService().getAll(
		{
			to: 6,
			$dateFrom: addDays(new Date(), 1),
		},
		{ headers: await headers() },
	);
	if (error) throw error;

	return (
		<TransactionList
			title="Transactions"
			subtitle="Your upcoming transactions"
			data={(transactions.data ?? []).map((t) => ({
				ID: t.id,
				receiver: t.receiver,
				processedAt: t.processedAt as Date,
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
			noResultsMessage="You don't have any upcoming transactions for this month"
		/>
	);
};
