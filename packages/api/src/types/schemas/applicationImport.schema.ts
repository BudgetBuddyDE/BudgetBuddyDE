import z from 'zod';
import {ApiResponse} from './common.schema';

export const ApplicationImportResource = z.enum([
  'categories',
  'payment-methods',
  'transactions',
  'recurring-payments',
  'budgets',
]);

export const ApplicationImportRecord = z.object({
  code: z.enum(['conflict', 'duplicate', 'persistence', 'reference', 'validation']),
  message: z.string(),
  row: z.number().int().positive(),
  sourceId: z.string().optional(),
});

export const ApplicationImportPreviewRecord = z.object({
  data: z.record(z.string(), z.union([z.boolean(), z.number(), z.string(), z.null()])),
  row: z.number().int().positive(),
  sourceId: z.string().optional(),
});

export const ApplicationImportResourceResult = z.object({
  created: z.array(ApplicationImportRecord),
  failed: z.array(ApplicationImportRecord),
  skipped: z.array(ApplicationImportRecord),
});

export const ApplicationImportResult = z.object({
  mode: z.enum(['preview', 'commit']),
  preview: z.record(ApplicationImportResource, z.array(ApplicationImportPreviewRecord)),
  resources: z.record(ApplicationImportResource, ApplicationImportResourceResult),
  summary: z.object({
    created: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    received: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  }),
});

export const ApplicationImportResponse = ApiResponse.extend({
  data: ApplicationImportResult,
});

export type TApplicationImportResult = z.infer<typeof ApplicationImportResult>;
export type TApplicationImportPreviewRecord = z.infer<typeof ApplicationImportPreviewRecord>;
export type TApplicationImportRecord = z.infer<typeof ApplicationImportRecord>;
