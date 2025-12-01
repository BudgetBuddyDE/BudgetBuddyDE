import { _TransactionService } from "@/services/Transaction.service";
import { createEntitySlice } from "../createEntitySlice";

export const transactionSlice = createEntitySlice("transaction", (query) =>
	new _TransactionService().getAll(query),
);
