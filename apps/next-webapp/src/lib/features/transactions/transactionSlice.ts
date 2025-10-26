import { TransactionService } from "@/services/Transaction.service";
import { createEntitySlice } from "../createEntitySlice";

export const transactionSlice = createEntitySlice("transaction", (query) =>
	TransactionService.getTransactionsWithCount(query),
);
