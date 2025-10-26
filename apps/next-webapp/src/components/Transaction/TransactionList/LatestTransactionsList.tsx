import { headers } from "next/headers";
import type React from "react";
import { TransactionService } from "@/services/Transaction.service";
import { TransactionList, type TransactionListProps } from "./TransactionList";

export type LatestTransactionsListProps = Pick<
	TransactionListProps,
	"onAddEntity"
>;

export const LatestTransactionsList: React.FC<
	LatestTransactionsListProps
> = async ({ onAddEntity }) => {
	const [transactions, error] = await TransactionService.getTransactions(
		{
			$top: 6,
		},
		{ headers: await headers() },
	);
	if (error) throw error;
	return (
		<TransactionList
			title="Transactions"
			subtitle="Your latest transactions"
			data={transactions.map((t) => ({
				ID: t.ID,
				receiver: t.receiver,
				processedAt: t.processedAt,
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
			noResultsMessage="You haven't made any transactions yet"
		/>
	);
};
