export const exportEntities = ['transactions', 'recurringPayments', 'categories', 'paymentMethods', 'budgets'] as const;
export const exportFormats = ['json', 'csv'] as const;

export type ExportEntity = (typeof exportEntities)[number];
export type ExportFormat = (typeof exportFormats)[number];
export type ExportableRecord = Record<string, unknown>;

export type ExampleConfig = {
  apiKey: string;
  backendUrl: string;
  limit: number;
};

export type ExportCommand = {
  entity: ExportEntity | 'all';
  format: ExportFormat;
  id?: string;
  verbose: boolean;
};

export type ExportResult = Partial<Record<ExportEntity, ExportableRecord[]>>;
