import type { TypeOfSchema } from "./common";
import type * as schema from "./schemas/category.schema";

export type TCategory = TypeOfSchema<typeof schema.Category>;
// export type TCreateCategoryPayload = TypeOfSchema<
// 	typeof schema.CreateCategoryPayload
// >;
// export type TUpdateCategoryPayload = TypeOfSchema<
// 	typeof schema.UpdateCategoryPayload
// >;
export type TCreateOrUpdateCategoryPayload = TypeOfSchema<
	typeof schema.CreateOrUpdateCategoryPayload
>;
export type TCategoryVH = TypeOfSchema<typeof schema.CategoryVH>;
export type TCategoryStats = TypeOfSchema<typeof schema.CategoryStats>;
