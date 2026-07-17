import type {
  BudgetInput,
  CategoryInput,
  CategoryView,
  EntityInput,
  EntityKind,
  PaymentMethodInput,
  PaymentMethodView,
  RecurringPaymentInput,
  TransactionInput,
} from '@/types/finance';

export interface ImportPreviewRow {
  rowNumber: number;
  kind: EntityKind;
  raw: Record<string, string>;
  input: EntityInput | null;
  errors: string[];
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

const normalize = (value: string) => value.toLocaleLowerCase().replaceAll(/[^a-z]/g, '');
const aliases: Record<string, string> = {
  processedat: 'date',
  transactiondate: 'date',
  transferamount: 'amount',
  information: 'note',
  categoryname: 'category',
  categorynames: 'categories',
  categoryids: 'categories',
  paymentmethodname: 'paymentmethod',
};

function parseDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return date;
}

function resolveReference(value: string, items: readonly {id: string; name: string}[]) {
  const normalized = value.toLocaleLowerCase();
  return items.find(item => item.id === value || item.name.toLocaleLowerCase() === normalized);
}

function inferKind(headers: string[]) {
  if (headers.includes('entitytype')) return 'transactions';
  if (headers.includes('interval') || headers.includes('executeat')) return 'recurring';
  if (headers.includes('provider') || headers.includes('address')) return 'payment-methods';
  if (headers.includes('receiver') || headers.includes('amount') || headers.includes('date')) return 'transactions';
  return 'categories';
}

function inputForRow(
  kind: EntityKind,
  field: (name: string) => string,
  categories: CategoryView[],
  paymentMethods: PaymentMethodView[],
) {
  const errors: string[] = [];
  if (kind === 'budgets') {
    const type = field('type') as BudgetInput['type'];
    const amount = Number(field('budget'));
    const categoryValues = field('categories')
      .split(';')
      .map(value => value.trim())
      .filter(Boolean);
    const categoryIds = categoryValues
      .map(value => resolveReference(value, categories)?.id)
      .filter((id): id is string => Boolean(id));
    if (!['i', 'e'].includes(type)) errors.push('Invalid budget type');
    if (!field('name')) errors.push('Missing name');
    if (!Number.isFinite(amount) || amount <= 0) errors.push('Invalid budget');
    if (categoryIds.length !== categoryValues.length) errors.push('Unknown category');
    return {
      errors,
      input: errors.length
        ? null
        : ({
            type,
            name: field('name'),
            budget: amount,
            categories: categoryIds,
            description: field('description') || undefined,
          } satisfies BudgetInput),
    };
  }
  if (kind === 'categories') {
    const name = field('name');
    if (!name) errors.push('Missing name');
    return {
      errors,
      input: errors.length ? null : ({name, description: field('description') || undefined} satisfies CategoryInput),
    };
  }
  if (kind === 'payment-methods') {
    const name = field('name');
    const provider = field('provider');
    const address = field('address');
    if (!name) errors.push('Missing name');
    if (!provider) errors.push('Missing provider');
    if (!address) errors.push('Missing address');
    return {
      errors,
      input: errors.length
        ? null
        : ({name, provider, address, description: field('description') || undefined} satisfies PaymentMethodInput),
    };
  }

  const category = resolveReference(field('category'), categories);
  const paymentMethod = resolveReference(field('paymentmethod'), paymentMethods);
  if (kind === 'transactions') {
    const date = parseDate(field('date'));
    const amount = Number(field('amount'));
    if (Number.isNaN(date.getTime())) errors.push('Invalid date');
    if (!Number.isFinite(amount) || amount === 0) errors.push('Invalid amount');
    if (!field('receiver')) errors.push('Missing receiver');
    if (!category) errors.push('Unknown category');
    if (!paymentMethod) errors.push('Unknown payment method');
    return {
      errors,
      input:
        errors.length === 0
          ? ({
              processedAt: date,
              receiver: field('receiver'),
              transferAmount: amount,
              information: field('note') || undefined,
              categoryId: category!.id,
              paymentMethodId: paymentMethod!.id,
            } satisfies TransactionInput)
          : null,
    };
  }

  const executeAt = Number(field('executeat'));
  const interval = field('interval') as RecurringPaymentInput['interval'];
  const amount = Number(field('amount'));
  if (!Number.isInteger(executeAt) || executeAt < 1 || executeAt > 31) errors.push('Invalid execution day');
  if (!['monthly', 'quarterly', 'yearly'].includes(interval)) errors.push('Invalid interval');
  if (!Number.isFinite(amount) || amount === 0) errors.push('Invalid amount');
  if (!field('receiver')) errors.push('Missing receiver');
  if (!category) errors.push('Unknown category');
  if (!paymentMethod) errors.push('Unknown payment method');
  const pausedValue = field('paused').toLocaleLowerCase();
  if (pausedValue && !['true', 'false', '1', '0', 'yes', 'no'].includes(pausedValue))
    errors.push('Invalid paused value');
  return {
    errors,
    input:
      errors.length === 0
        ? ({
            executeAt,
            interval,
            paused: ['true', '1', 'yes'].includes(pausedValue),
            receiver: field('receiver'),
            transferAmount: amount,
            information: field('note') || undefined,
            categoryId: category!.id,
            paymentMethodId: paymentMethod!.id,
          } satisfies RecurringPaymentInput)
        : null,
  };
}

export function createImportPreview(
  content: string,
  categories: CategoryView[],
  paymentMethods: PaymentMethodView[],
): ImportPreviewRow[] {
  const rows = parseCsv(content);
  const headers = (rows[0] ?? []).map(header => aliases[normalize(header)] ?? normalize(header));
  return rows.slice(1).map((values, index) => {
    const raw = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? '']));
    const declaredKind = raw.entitytype ? normalize(raw.entitytype) : '';
    const kind =
      declaredKind === 'category' || declaredKind === 'categories'
        ? 'categories'
        : declaredKind === 'paymentmethod' || declaredKind === 'paymentmethods'
          ? 'payment-methods'
          : declaredKind === 'budget' || declaredKind === 'budgets'
            ? 'budgets'
            : declaredKind === 'recurring' ||
                declaredKind === 'recurringpayment' ||
                declaredKind === 'recurringpayments'
              ? 'recurring'
              : declaredKind === 'transaction' || declaredKind === 'transactions'
                ? 'transactions'
                : inferKind(headers);
    const field = (name: string) => raw[name] ?? '';
    const result = inputForRow(kind, field, categories, paymentMethods);
    return {rowNumber: index + 2, kind, raw, errors: result.errors, input: result.input};
  });
}

export function createTransactionImportPreview(
  content: string,
  categories: CategoryView[],
  paymentMethods: PaymentMethodView[],
) {
  return createImportPreview(content, categories, paymentMethods).filter(row => row.kind === 'transactions');
}
