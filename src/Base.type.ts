import {z} from 'zod';

export const ZDescription = z
  .string()
  .nullable()
  .transform(val => (typeof val === 'string' && val.length == 0 ? null : val))
  .default(null);
export type TDescription = z.infer<typeof ZDescription>;

export const ZCreatedAt = z
  .date()
  .or(z.number())
  .transform(val => new Date(val));
export type TCreatedAt = z.infer<typeof ZCreatedAt>;

export const ZDate = ZCreatedAt;
export type TDate = z.infer<typeof ZDate>;

export const ZEmail = z.string().min(1, {message: 'This field has to be filled.'}).email('This is not a valid email.');

export type TEmail = z.infer<typeof ZEmail>;

export type TServiceResponse<T> = [T, null] | [null, Error];
