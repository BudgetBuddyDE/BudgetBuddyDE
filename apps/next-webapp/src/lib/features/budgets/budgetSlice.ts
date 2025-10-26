import { BudgetService } from "@/services/Budget.service";
import { createEntitySlice } from "../createEntitySlice";

export const budgetSlice = createEntitySlice("budget", (query) =>
	BudgetService.getWithCount(query),
);
