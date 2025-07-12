import {z} from 'zod';

import {IdAspect, ManagedAspect, OptionalIdAspect} from './_Aspects';
import {DescriptionType, ODataContextAspect, OwnerAspect} from './_Base';

// Base model
export const Category = z.object({
  ...IdAspect.shape,
  name: z.string().min(1).max(80),
  description: DescriptionType,
  ...OwnerAspect.shape,
  ...ManagedAspect.shape,
});
export type TCategory = z.infer<typeof Category>;

export const CreateOrUpdateCategory = Category.pick({
  name: true,
  description: true,
}).merge(OptionalIdAspect);
export type TCreateOrUpdateCategory = z.infer<typeof CreateOrUpdateCategory>;

// Response from OData
export const CategoryResponse = Category.extend(ODataContextAspect.shape);
export type TCategoryResponse = z.infer<typeof CategoryResponse>;

// Value-Help
export const Category_VH = Category.pick({
  ID: true,
  name: true,
  description: true,
});
export type TCategory_VH = z.infer<typeof Category_VH>;
