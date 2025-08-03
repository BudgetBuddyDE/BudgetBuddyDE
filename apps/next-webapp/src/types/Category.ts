import {z} from 'zod';

import {IdAspect, ManagedAspect, OptionalIdAspect} from './_Aspects';
import {DescriptionType, ODataContextAspect, OwnerAspect, UserID} from './_Base';

/**
 * Category
 */
export const Category = z.object({
  ...IdAspect.shape,
  name: z.string().min(1).max(80),
  description: DescriptionType,
  ...OwnerAspect.shape,
  ...ManagedAspect.shape,
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
}).merge(OptionalIdAspect);
/**
 * Create or Update Category
 */
export type TCreateOrUpdateCategory = z.infer<typeof CreateOrUpdateCategory>;

/**
 * Response from OData
 */
export const CategoryResponse = Category.extend(ODataContextAspect.shape);
/**
 * Response from OData
 */
export type TCategoryResponse = z.infer<typeof CategoryResponse>;

/**
 * Value Help for Category
 */
export const Category_VH = Category.pick({
  ID: true,
  name: true,
  description: true,
});
/**
 * Value Help for Category
 */
export type TCategory_VH = z.infer<typeof Category_VH>;

/**
 * Category Statistics
 */
export const CategoryStats = z.object({
  toCategory_ID: Category.shape.ID,
  balance: z.number(),
  income: z.number(),
  expenses: z.number(),
  // start: CdsDate,
  // end: CdsDate,
  createdBy: UserID,
});
/**
 * Category Statistics
 */
export type TCategoryStats = z.infer<typeof CategoryStats>;

/**
 * Expanded Category Statistics
 * Includes the full Category object instead of just the ID
 */
export const ExpandedCategoryStats = CategoryStats.omit({
  toCategory_ID: true,
}).extend({
  toCategory: Category,
});
/**
 * Expanded Category Statistics
 * Includes the full Category object instead of just the ID
 */
export type TExpandedCategoryStats = z.infer<typeof ExpandedCategoryStats>;
