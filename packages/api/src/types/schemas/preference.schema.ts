import z from 'zod';
import {ApiResponse, UserID} from './common.schema';

export const Preference = z.object({
  ownerId: UserID,
  onboardingCompleted: z.boolean(),
  language: z.string().regex(/^[a-z]{2,3}_[A-Z]{2}$/),
  timeZone: z.string(),
  currency: z.currencyCode(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const languageSchema = z
  .string()
  .regex(/^[a-z]{2,3}_[A-Z]{2}$/)
  .refine(value => {
    try {
      return new Intl.Locale(value.replace('_', '-')).toString().replace('-', '_') === value;
    } catch {
      return false;
    }
  }, 'Expected a valid language and region locale, such as en_US');

const timeZoneSchema = z.string().refine(value => {
  try {
    new Intl.DateTimeFormat('en-US', {timeZone: value});
    return true;
  } catch {
    return false;
  }
}, 'Expected a valid IANA timezone');

export const UpdatePreferencePayload = z
  .object({
    onboardingCompleted: z.boolean().optional(),
    language: languageSchema.optional(),
    timeZone: timeZoneSchema.optional(),
    currency: z.currencyCode().optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, 'At least one preference must be provided');

export const GetPreferenceResponse = ApiResponse.extend({data: Preference});
export const UpdatePreferenceResponse = GetPreferenceResponse;
