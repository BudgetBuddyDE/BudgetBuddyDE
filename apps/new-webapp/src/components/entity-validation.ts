import type {EntityInput, EntityKind} from '@/types/finance';

export interface EntityParseResult {
  input?: EntityInput;
  error?: string;
}

type EntityParser = (formData: FormData) => EntityParseResult;

const stringValue = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim();

const parseCategory: EntityParser = formData => {
  const name = stringValue(formData, 'name');
  if (!name) return {error: 'Enter a category name.'};
  return {input: {name, description: stringValue(formData, 'description') || undefined}};
};

const parsePaymentMethod: EntityParser = formData => {
  const name = stringValue(formData, 'name');
  const provider = stringValue(formData, 'provider');
  const address = stringValue(formData, 'address');
  if (!name || !provider || !address) return {error: 'Name, provider, and account reference are required.'};
  return {input: {name, provider, address, description: stringValue(formData, 'description') || undefined}};
};

const parseTransaction: EntityParser = formData => {
  const amount = Number(stringValue(formData, 'amount'));
  const date = new Date(`${stringValue(formData, 'processedAt')}T12:00:00`);
  if (!Number.isFinite(amount) || amount <= 0) return {error: 'Enter an amount greater than zero.'};
  if (Number.isNaN(date.getTime())) return {error: 'Choose a valid transaction date.'};
  const receiver = stringValue(formData, 'receiver');
  const categoryId = stringValue(formData, 'categoryId');
  const paymentMethodId = stringValue(formData, 'paymentMethodId');
  if (!receiver || !categoryId || !paymentMethodId)
    return {error: 'Receiver, category, and payment method are required.'};
  return {
    input: {
      processedAt: date,
      receiver,
      transferAmount: stringValue(formData, 'type') === 'expense' ? -amount : amount,
      information: stringValue(formData, 'information') || undefined,
      categoryId,
      paymentMethodId,
    },
  };
};

const parseRecurring: EntityParser = formData => {
  const amount = Number(stringValue(formData, 'amount'));
  const executeAt = Number(stringValue(formData, 'executeAt'));
  if (!Number.isFinite(amount) || amount <= 0) return {error: 'Enter an amount greater than zero.'};
  if (!Number.isInteger(executeAt) || executeAt < 1 || executeAt > 31)
    return {error: 'Execution day must be between 1 and 31.'};
  const receiver = stringValue(formData, 'receiver');
  const categoryId = stringValue(formData, 'categoryId');
  const paymentMethodId = stringValue(formData, 'paymentMethodId');
  if (!receiver || !categoryId || !paymentMethodId)
    return {error: 'Receiver, category, and payment method are required.'};
  const interval = stringValue(formData, 'interval');
  return {
    input: {
      executeAt,
      interval: interval === 'yearly' ? 'yearly' : interval === 'quarterly' ? 'quarterly' : 'monthly',
      paused: stringValue(formData, 'paused') === 'true',
      receiver,
      transferAmount: stringValue(formData, 'type') === 'expense' ? -amount : amount,
      information: stringValue(formData, 'information') || undefined,
      categoryId,
      paymentMethodId,
    },
  };
};

const parseBudget: EntityParser = formData => {
  const budget = Number(stringValue(formData, 'budget'));
  const name = stringValue(formData, 'name');
  if (!name || !Number.isFinite(budget) || budget < 0) return {error: 'Enter a name and a valid target amount.'};
  return {
    input: {
      type: stringValue(formData, 'type') === 'i' ? 'i' : 'e',
      name,
      description: stringValue(formData, 'description') || undefined,
      budget,
      categories: formData.getAll('categories').map(String),
    },
  };
};

const ENTITY_PARSERS: Record<EntityKind, EntityParser> = {
  transactions: parseTransaction,
  categories: parseCategory,
  'payment-methods': parsePaymentMethod,
  recurring: parseRecurring,
  budgets: parseBudget,
};

export function parseEntityForm(kind: EntityKind, form: HTMLFormElement): EntityParseResult {
  return ENTITY_PARSERS[kind](new FormData(form));
}
