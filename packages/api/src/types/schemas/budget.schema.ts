import z from "zod";
import { Category } from "./category.schema";
import { ApiResponse, UserID } from "./common.schema";

export const BudgetType = z.enum(["i", "e"]);

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

// export const CreateBudgetPayload = Budget.pick({
// 	type: true,
// 	budget: true,
// 	name: true,
// 	description: true,
// }).extend({
// 	categories: z.array(Category.shape.id),
// });

// export const UpdateBudgetPayload = z.object({
// 	type: Budget.shape.type.optional(),
// 	budget: Budget.shape.budget.optional(),
// 	name: Budget.shape.name.optional(),
// 	description: Budget.shape.description.optional(),
// 	categories: z.array(Category.shape.id).optional(),
// });

export const CreateOrUpdateBudgetPayload = Budget.pick({
	type: true,
	name: true,
	description: true,
	budget: true,
}).extend({
	categories: z.array(Category.shape.id),
	description: Budget.shape.description.optional(),
});

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

export const GetAllBudgetsResponse = ApiResponse.extend({
	data: z.array(Budget).nullable(),
});
export const GetBudgetResponse = ApiResponse.extend({
	data: Budget.nullable(),
});
export const CreateBudgetResponse = ApiResponse.extend({
	data: Budget,
});
export const UpdateBudgetResponse = CreateBudgetResponse;
export const DeleteBudgetResponse = ApiResponse.extend({
	data: z.null(),
});
export const EstimatedBudgetResponse = ApiResponse.extend({
	data: EstimatedBudget,
});
