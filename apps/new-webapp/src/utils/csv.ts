import type {CategoryView, PaymentMethodView, TransactionInput} from '@/types/finance';

export type ImportError =
  | 'csv.invalidDate'
  | 'csv.invalidAmount'
  | 'csv.missingReceiver'
  | 'csv.unknownCategory'
  | 'csv.unknownPaymentMethod';

export interface ImportPreviewRow {
  rowNumber: number;
  raw: Record<string, string>;
  input: TransactionInput | null;
  errors: ImportError[];
}

export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && content[index + 1] === '\n') index += 1;
      row.push(value.trim());
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some(cell => cell.length > 0)) rows.push(row);
  return rows;
}

export function createTransactionImportPreview(
  content: string,
  categories: CategoryView[],
  paymentMethods: PaymentMethodView[],
): ImportPreviewRow[] {
  const rows = parseCsv(content);
  const headers = (rows[0] ?? []).map(header => header.toLocaleLowerCase().replaceAll(/[^a-z]/g, ''));
  const field = (values: string[], name: string) => values[headers.indexOf(name)] ?? '';

  return rows.slice(1).map((values, index) => {
    const raw = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? '']));
    const date = new Date(`${field(values, 'date')}T12:00:00`);
    const amount = Number(field(values, 'amount'));
    const categoryName = field(values, 'category').toLocaleLowerCase();
    const methodName = field(values, 'paymentmethod').toLocaleLowerCase();
    const category = categories.find(item => item.name.toLocaleLowerCase() === categoryName);
    const paymentMethod = paymentMethods.find(item => item.name.toLocaleLowerCase() === methodName);
    const errors: ImportError[] = [];
    if (Number.isNaN(date.getTime())) errors.push('csv.invalidDate');
    if (!Number.isFinite(amount) || amount === 0) errors.push('csv.invalidAmount');
    if (!field(values, 'receiver')) errors.push('csv.missingReceiver');
    if (!category) errors.push('csv.unknownCategory');
    if (!paymentMethod) errors.push('csv.unknownPaymentMethod');

    return {
      rowNumber: index + 2,
      raw,
      errors,
      input:
        errors.length === 0
          ? {
              processedAt: date,
              receiver: field(values, 'receiver'),
              transferAmount: amount,
              information: field(values, 'note') || undefined,
              categoryId: category!.id,
              paymentMethodId: paymentMethod!.id,
            }
          : null,
    };
  });
}
