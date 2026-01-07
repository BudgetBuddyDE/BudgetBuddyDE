import type { TypeOfSchema } from "./common";
import type * as schema from "./schemas/budget.schema";

export type TBudgetType = TypeOfSchema<typeof schema.BudgetType>;
export type TBudget = TypeOfSchema<typeof schema.Budget>;
// export type TCreateBudgetPayload = TypeOfSchema<
//   typeof schema.CreateBudgetPayload
// >;
// export type TUpdateBudgetPayload = TypeOfSchema<
//   typeof schema.UpdateBudgetPayload
// >;
export type TCreateOrUpdateBudgetPayload = TypeOfSchema<
	typeof schema.CreateOrUpdateBudgetPayload
>;
export type TEstimatedBudget = TypeOfSchema<typeof schema.EstimatedBudget>;
