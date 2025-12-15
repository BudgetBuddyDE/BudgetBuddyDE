import {z} from 'zod';

// export type NullableFields<T> = {
// 	[K in keyof T]?: T[K] | null;
// };

export const UserID = z.string().brand('UserID');

export const ApiResponse = z.object({
  status: z.number(),
  message: z.string().optional(),
  totalCount: z.number().optional(),
  from: z.enum(['db', 'cache', 'external']).optional(),
});
export type TApiResponse<T> = z.infer<typeof ApiResponse> & {
  data: T;
};
