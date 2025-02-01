import {z} from 'zod';
import {ZBaseModel, ZId} from './PocketBase.types';
import {ZCategory} from './Category.types';

export const ZBudget = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    label: z.string(),
    categories: z.array(ZId),
    budget: z.number(),
    type: z.enum(['include', 'exclude']),
  }).shape,
});
export type TBudget = z.infer<typeof ZBudget>;

export const ZExpandedBudget = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    label: z.string(),
    categories: z.array(ZId),
    expand: z.object({
      categories: z.array(ZCategory),
    }),
    budget: z.number(),
    type: z.enum(['include', 'exclude']),
  }).shape,
});
export type TExpandedBudget = z.infer<typeof ZExpandedBudget>;

export const ZBudgetProgress = z.object({
  ...ZBudget.shape,
  progress: z.number(),
});
export type TBudgetProgress = z.infer<typeof ZBudgetProgress>;

export const ZExpandedBudgetProgress = z.object({
  ...ZBudget.shape,
  progress: z.number(),
});
export type TExpandedBudgetProgress = z.infer<typeof ZExpandedBudgetProgress>;

export const ZCreateBudgetPayload = z.object({
  owner: ZId,
  label: z.string(),
  categories: z.array(ZId),
  budget: z.number().min(0),
  type: z.enum(['include', 'exclude']),
});
export type TCreateBudgetPayload = z.infer<typeof ZCreateBudgetPayload>;

export const ZUpdateBudgetPayload = z.object({
  owner: ZId,
  label: z.string(),
  categories: z.array(ZId),
  budget: z.number().min(0),
  type: z.enum(['include', 'exclude']),
});
export type TUpdateBudgetPayload = z.infer<typeof ZUpdateBudgetPayload>;

export const ZDeleteBudgetPayload = z.object({
  id: ZId,
});
export type TDeleteBudgetPayload = z.infer<typeof ZDeleteBudgetPayload>;
