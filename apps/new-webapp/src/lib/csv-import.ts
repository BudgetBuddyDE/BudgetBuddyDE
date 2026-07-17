import type {TransactionDraft} from '@/types/transaction';
import {parseLocalDate, toDateInputValue} from '@/utils/date';
import {parseMoneyToMinorUnits} from '@/utils/money';

export interface CsvDocument {
  headers: string[];
  rows: string[][];
}
export interface CsvMapping {
  date: string;
  amount: string;
  receiver: string;
  information?: string;
  type?: string;
}
export interface ImportDefaults {
  categoryId: string;
  paymentMethodId: string;
}
export interface ImportPreview {
  row: number;
  values: string[];
  draft?: TransactionDraft;
  errors: string[];
}

export function parseCsv(input: string): CsvDocument {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  const text = input.replace(/^\uFEFF/, '');
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      value = '';
      if (row.some(cell => cell.length)) rows.push(row);
      row = [];
    } else value += character;
  }
  row.push(value);
  if (row.some(cell => cell.length)) rows.push(row);
  const [headers = [], ...records] = rows;
  return {headers: headers.map(header => header.trim()), rows: records};
}

function cell(headers: string[], values: string[], column?: string): string {
  if (!column) return '';
  const index = headers.indexOf(column);
  return index < 0 ? '' : (values[index] ?? '').trim();
}

export function mapCsvRows(document: CsvDocument, mapping: CsvMapping, defaults: ImportDefaults): ImportPreview[] {
  return document.rows.map((values, index) => {
    const errors: string[] = [];
    const rawDate = cell(document.headers, values, mapping.date);
    const date = parseLocalDate(rawDate);
    if (!date) errors.push('Invalid date');
    const rawAmount = cell(document.headers, values, mapping.amount);
    const amountSign = rawAmount.startsWith('-') ? -1 : 1;
    const parsedAmount = parseMoneyToMinorUnits(rawAmount.replace(/^[+-]/, ''));
    const minorAmount = parsedAmount === null ? null : parsedAmount * amountSign;
    if (minorAmount === null) errors.push('Invalid amount');
    const receiver = cell(document.headers, values, mapping.receiver);
    if (!receiver) errors.push('Missing receiver');
    if (!defaults.categoryId) errors.push('Missing category');
    if (!defaults.paymentMethodId) errors.push('Missing payment method');
    if (errors.length || !date || minorAmount === null) return {row: index + 2, values, errors};
    const direction = cell(document.headers, values, mapping.type).toLocaleLowerCase();
    const amount =
      direction === 'expense' || direction === 'debit'
        ? -Math.abs(minorAmount)
        : direction === 'income' || direction === 'credit'
          ? Math.abs(minorAmount)
          : minorAmount;
    return {
      row: index + 2,
      values,
      errors,
      draft: {
        amount: (Math.abs(amount) / 100).toFixed(2),
        type: amount < 0 ? 'expense' : 'income',
        date: toDateInputValue(date),
        categoryId: defaults.categoryId,
        paymentMethodId: defaults.paymentMethodId,
        receiver,
        information: cell(document.headers, values, mapping.information),
      },
    };
  });
}
