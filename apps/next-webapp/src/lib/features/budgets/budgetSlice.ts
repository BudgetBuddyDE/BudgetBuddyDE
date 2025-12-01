import { _BudgetService } from "@/services/Budget.service";
import { createEntitySlice } from "../createEntitySlice";

export const budgetSlice = createEntitySlice("budget", (query) =>
	new _BudgetService().getAll(query),
);
