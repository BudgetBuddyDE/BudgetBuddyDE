import {z} from 'zod';

import {UserID} from './_Base';

export const CdsDate = z
  .date()
  .or(z.string())
  .transform(val => (typeof val === 'string' ? new Date(val) : val));
export type TCdsDate = z.infer<typeof CdsDate>;

export const GUID = z.string().uuid();
export type TGUID = z.infer<typeof GUID>;

export const IdAspect = z.object({
  ID: GUID,
});
export type TIdAspect = z.infer<typeof IdAspect>;

export const OptionalIdAspect = z.object({
  ID: GUID.optional(),
});
export type TOptionalIdAspect = z.infer<typeof OptionalIdAspect>;

export const ManagedAspect = z.object({
  createdAt: CdsDate,
  createdBy: UserID,
  modifiedAt: CdsDate,
  modifiedBy: UserID,
});
export type TManagedAspect = z.infer<typeof ManagedAspect>;
