import { Backend } from "@/services/Backend";
import { createEntitySlice } from "../createEntitySlice";

export const transactionSlice = createEntitySlice("transaction", (query) =>
	Backend.transaction.getAll(query),
);
