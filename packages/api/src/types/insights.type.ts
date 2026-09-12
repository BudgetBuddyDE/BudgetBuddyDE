import type {TypeOfSchema} from './common';
import type * as schema from './schemas/insights.schema';

export type THistoricalBalance = TypeOfSchema<typeof schema.HistoricalBalance>;
export type THistoricalCategoryBalance = TypeOfSchema<typeof schema.HistoricalCategoryBalance>;
