import {z} from 'zod';
import {ZBaseModel, ZId} from './PocketBase.types';
import {ZCategory} from './Category.types';

export const ZBudget = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    category: ZId,
    budget: z.number(),
    expand: z.object({
      category: ZCategory,
    }),
  }).shape,
});
export type TBudget = z.infer<typeof ZBudget>;

export const ZCreateBudgetPayload = z.object({
  owner: ZId,
  category: ZId,
  budget: z.number(),
});
export type TCreateBudgetPayload = z.infer<typeof ZCreateBudgetPayload>;

export const ZUpdateBudgetPayload = z.object({
  owner: ZId,
  category: ZId,
  budget: z.number(),
});
export type TUpdateBudgetPayload = z.infer<typeof ZUpdateBudgetPayload>;
