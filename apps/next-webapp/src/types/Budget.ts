import { z } from "zod";
import { UserID } from "./_Base";
import { Category } from "./Category";

export const BudgetType = z.enum(["i", "e"]);

// Base model
export const Budget = z.object({
	id: z.uuid(),
	ownerId: UserID,
	type: BudgetType,
	budget: z.number().min(0, "The budget must be a positive number"),
	balance: z.number(),
	name: z.string().min(1).max(40),
	description: z.string().max(200).nullable().default(null),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	categories: z.array(
		z.object({
			budgetId: z.uuid(),
			categoryId: Category.shape.id,
			category: Category,
		}),
	),
});
export type TBudget = z.infer<typeof Budget>;

// Create or Update model
export const CreateOrUpdateBudget = Budget.pick({
	type: true,
	name: true,
	description: true,
	budget: true,
}).extend({
	categories: z.array(Category.shape.id),
});
export type TCreateOrUpdateBudget = z.infer<typeof CreateOrUpdateBudget>;

export const EstimatedBudget = z.object({
	expenses: z.object({
		paid: z.number(),
		upcoming: z.number(),
	}),
	income: z.object({
		received: z.number(),
		upcoming: z.number(),
	}),
	freeAmount: z.number(),
});
export type TEstimatedBudget = z.infer<typeof EstimatedBudget>;
