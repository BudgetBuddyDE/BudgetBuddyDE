import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { categories } from './tables';

export const CategorySchemas = {
  select: createSelectSchema(categories),
  insert: createInsertSchema(categories),
  update: createUpdateSchema(categories),
};
