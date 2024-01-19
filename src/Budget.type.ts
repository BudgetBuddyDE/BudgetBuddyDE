import {z} from 'zod';
import {ZCategory} from './Category.type';
import {ZUser} from './User.type';
import {ZCreatedAt} from './Base.type';

const ZBudgetAmount = z.number().min(0, {message: 'Budget must be positive'});

export const ZBudget = z.object({
  id: z.number(),
  category: ZCategory,
  owner: ZUser,
  budget: ZBudgetAmount,
  createdAt: ZCreatedAt,
});
export type TBudget = z.infer<typeof ZBudget>;

export const ZCreateBudgetPayload = z.object({
  owner: z.string().uuid(),
  categoryId: z.number(),
  budget: ZBudgetAmount,
});
export type TCreateBudgetPayload = z.infer<typeof ZCreateBudgetPayload>;

export const ZUpdateBudgetPayload = z.object({
  budgetId: z.number(),
  categoryId: z.number(),
  budget: ZBudgetAmount,
});
export type TUpdateBudgetPayload = z.infer<typeof ZUpdateBudgetPayload>;

export const ZDeleteBudgetPayload = z.array(
  z.object({
    budgetId: z.number(),
  }),
);
export type TDeleteBudgetPayload = z.infer<typeof ZDeleteBudgetPayload>;
export const ZDeleteBudgetResponsePayload = z.object({
  success: z.array(ZBudget),
  failed: ZDeleteBudgetPayload,
});
export type TDeleteBudgetResponsePayload = z.infer<typeof ZDeleteBudgetResponsePayload>;

export const ZBudgetProgress = ZBudget.extend({
  amount_spent: z.number(),
});
export type TBudgetProgress = z.infer<typeof ZBudgetProgress>;
