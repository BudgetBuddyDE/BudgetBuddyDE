import {z} from 'zod';

const ZodDate = z
  .date()
  .or(z.number())
  .or(z.string())
  .transform(val => new Date(val));
const CurrencyCode = z.string().toUpperCase().length(3);
const CountryCode = z.string().toUpperCase().length(2);

export const common = {
  ZodDate,
  CurrencyCode,
  CountryCode,
};
