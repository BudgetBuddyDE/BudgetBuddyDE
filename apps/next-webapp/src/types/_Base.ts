import {z} from 'zod';

export type NullableFields<T> = {
  [K in keyof T]?: T[K] | null;
};

export const UserID = z.string().nonempty();
export type TUserID = z.infer<typeof UserID>;

export const DescriptionType = z
  .string()
  .nullable()
  .default(null)
  .transform(val => (val === '' ? null : val));
export type TDescriptionType = z.infer<typeof DescriptionType>;

export const ODataContextAspect = z.object({
  '@odata.context': z.string().optional(),
});
export type TODataContextAspect = z.infer<typeof ODataContextAspect>;

export const OwnerAspect = z.object({
  owner: UserID,
});
export type TOwnerAspect = z.infer<typeof OwnerAspect>;
