import { backendSchema } from "./schema";

export const budgetType = backendSchema.enum("budget_type", ["i", "e"]);
