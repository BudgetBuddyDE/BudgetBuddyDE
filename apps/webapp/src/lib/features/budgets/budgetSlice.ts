import { Backend } from "@/services/Backend";
import { createEntitySlice } from "../createEntitySlice";

export const budgetSlice = createEntitySlice("budget", (query) =>
	Backend.budget.getAll(query),
);
