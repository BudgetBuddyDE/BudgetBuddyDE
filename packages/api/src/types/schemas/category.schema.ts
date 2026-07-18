import z from 'zod';
import {ApiResponse, UserID} from './common.schema';

export const Category = z.object({
  id: z.uuid().brand('CategoryID'),
  ownerId: UserID,
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// export const CreateCategoryPayload = Category.pick({
// 	name: true,
// 	description: true,
// });

// export const UpdateCategoryPayload = z.object({
// 	name: Category.shape.name.optional(),
// 	description: Category.shape.description.optional(),
// });

export const CreateOrUpdateCategoryPayload = Category.pick({
  name: true,
  description: true,
}).extend({
  description: Category.shape.description.optional(),
});

export const BatchCreateCategoryPayload = z.array(CreateOrUpdateCategoryPayload).min(1).max(100);
export const BatchUpdateCategoryPayload = z
  .object({
    updates: z
      .array(
        z.object({
          id: Category.shape.id,
          data: CreateOrUpdateCategoryPayload.partial(),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine(({updates}, ctx) => {
    if (new Set(updates.map(update => update.id)).size !== updates.length) {
      ctx.addIssue({code: 'custom', path: ['updates'], message: 'Update IDs must be unique'});
    }
  });

export const CategoryVH = Category.pick({
  id: true,
  name: true,
  description: true,
});

export const CategoryStats = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  stats: z.array(
    z.object({
      balance: z.number(),
      income: z.number(),
      expenses: z.number(),
      category: Category.pick({
        id: true,
        name: true,
        description: true,
      }),
    }),
  ),
});

export const GetAllCategoriesResponse = ApiResponse.extend({
  data: z.array(Category).nullable(),
});
export const GetCategoryResponse = ApiResponse.extend({
  data: Category.nullable(),
});
export const CreateCategoryResponse = ApiResponse.extend({
  data: z.array(Category).nullable(),
});
export const UpdateCategoryResponse = CreateCategoryResponse;
export const BatchCreateCategoryResponse = CreateCategoryResponse;
export const BatchUpdateCategoryResponse = UpdateCategoryResponse;
export const DeleteCategoryResponse = CreateCategoryResponse;
export const CategoryStatsResponse = ApiResponse.extend({
  data: CategoryStats,
});
export const MergeCategoriesResponse = ApiResponse.extend({
  data: z.object({
    source: z.array(Category.shape.id).transform(ids => new Set(ids)),
    target: Category.shape.id,
  }),
});
