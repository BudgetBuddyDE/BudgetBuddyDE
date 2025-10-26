import { z } from "zod";
import { IdAspect, ManagedAspect, OptionalIdAspect } from "./_Aspects";
import { ODataContextAspect, ODataCountAspect, OwnerAspect } from "./_Base";
import { Category } from "./Category";

export const BudgetType = z.enum(["i", "e"]);
export type TBudgetType = z.infer<typeof BudgetType>;

// Base model
export const Budget = z.object({
	...IdAspect.shape,
	type: BudgetType,
	balance: z.number().optional(),
	budget: z.number().min(0, "The budget must be a positive number"),
	name: z.string().min(1).max(40),
	...OwnerAspect.shape,
	...ManagedAspect.shape,
});
export type TBudget = z.infer<typeof Budget>;

// Expanded model
export const ExpandedBudget = Budget.extend({
	toCategories: z.array(
		z.object({
			up__ID: Budget.shape.ID,
			toCategory_ID: Category.shape.ID,
			toCategory: Category,
		}),
	),
});
export type TExpandedBudget = z.infer<typeof ExpandedBudget>;

/**
 * Budgets with Count
 */
export const ExpandedBudgetsWithCount = z.object({
	...ODataContextAspect.shape,
	...ODataCountAspect.shape,
	value: z.array(ExpandedBudget),
});
export type TExpandedBudgetsWithCount = z.infer<
	typeof ExpandedBudgetsWithCount
>;

// Create or Update model
export const CreateOrUpdateBudget = Budget.pick({
	type: true,
	name: true,
	budget: true,
})
	.merge(OptionalIdAspect)
	.extend({
		toCategories: z.array(
			z.object({
				toCategory_ID: Category.shape.ID,
			}),
		),
	});
export type TCreateOrUpdateBudget = z.infer<typeof CreateOrUpdateBudget>;

// Response from OData
export const BudgetResponse = Budget.extend(ODataContextAspect.shape);
export type TBudgetResponse = z.infer<typeof BudgetResponse>;
