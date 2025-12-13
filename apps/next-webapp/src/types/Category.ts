import { z } from "zod";
import { UserID } from "./_Base";

/**
 * Category
 */
export const Category = z.object({
	id: z.uuid().brand("CategoryID"),
	ownerId: UserID,
	name: z.string(),
	description: z.string().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
/**
 * Category
 */
export type TCategory = z.infer<typeof Category>;

/**
 * Create or Update Category
 */
export const CreateOrUpdateCategory = Category.pick({
	name: true,
	description: true,
}).extend({ description: Category.shape.description.optional() });
/**
 * Create or Update Category
 */
export type TCreateOrUpdateCategory = z.infer<typeof CreateOrUpdateCategory>;

/**
 * Value Help for Category
 */
export const CategoryVH = Category.pick({
	id: true,
	name: true,
	description: true,
});
/**
 * Value Help for Category
 */
export type TCategoryVH = z.infer<typeof CategoryVH>;

/**
 * Category Statistics
 */
export const CategoryStats = z.object({
	from: z.coerce.date(),
	to: z.coerce.date(),
	stats: z.array(
		z.object({
			balance: z.number(),
			income: z.number(),
			expenses: z.number(),
			category: Category.pick({ id: true, name: true, description: true }),
		}),
	),
});
/**
 * Category Statistics
 */
export type TCategoryStats = z.infer<typeof CategoryStats>;
