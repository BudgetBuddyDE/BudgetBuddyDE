import type {TypeOfSchema} from './common';
import type * as schema from './schemas/preference.schema';

export type TPreference = TypeOfSchema<typeof schema.Preference>;
export type TUpdatePreferencePayload = TypeOfSchema<typeof schema.UpdatePreferencePayload>;

export type TGetPreferenceResponse = TypeOfSchema<typeof schema.GetPreferenceResponse>;
export type TUpdatePreferenceResponse = TypeOfSchema<typeof schema.UpdatePreferenceResponse>;
