import { backendSchema } from "./schema";

export const budgetType = backendSchema.enum("budget_type", ["i", "e"]);

export const executionPlanType = backendSchema.enum("execution_plan_type", [
	"daily",
	"weekly",
	"bi-weekly",
	"monthly",
	"quarterly",
	"yearly",
]);
