import type React from "react";
import { headers } from "@/lib/headers";
import { _TransactionService } from "@/services/Transaction.service";
import { TransactionList, type TransactionListProps } from "./TransactionList";

export type LatestTransactionsListProps = Pick<
	TransactionListProps,
	"onAddEntity"
>;

export const LatestTransactionsList: React.FC<
	LatestTransactionsListProps
> = async ({ onAddEntity }) => {
	const clientHeaders = await headers();
	const [transactions, error] = await new _TransactionService().getAll(
		{
			to: 6,
			$dateTo: new Date(),
		},
		{ headers: clientHeaders },
	);
	if (error) throw error;
	return (
		<TransactionList
			title="Transactions"
			subtitle="Your latest transactions"
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
			noResultsMessage="You haven't made any transactions yet"
		/>
	);
};
