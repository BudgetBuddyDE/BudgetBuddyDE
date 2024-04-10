import {z} from 'zod';
import {ZDate} from './Base.type';

/**
 * @description	15 characters string to store as record ID. If not set, it will be auto generated.
 */
export const ZId = z.string().length(15);
export type TId = z.infer<typeof ZId>;

export const ZBaseModel = z.object({
  id: ZId,
  created: ZDate,
  updated: ZDate,
});
export type TBaseModel = z.infer<typeof ZBaseModel>;

export const ZNullableString = z
  .string()
  .nullable()
  .optional()
  .transform(v => (typeof v === 'string' && v.length > 0 ? v : null));
export type TNullableString = z.infer<typeof ZNullableString>;
