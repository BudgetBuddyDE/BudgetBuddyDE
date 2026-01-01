import {z} from 'zod';

export const CdsDate = z
  .date()
  .or(z.string())
  .transform(val => (typeof val === 'string' ? new Date(val) : val));
