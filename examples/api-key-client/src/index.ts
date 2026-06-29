import {Api} from '@budgetbuddyde/api';
import type {TExpandedRecurringPayment, TExpandedTransaction} from '@budgetbuddyde/api/types';
import {config as loadEnv} from 'dotenv';

loadEnv();

const DEFAULT_RESULT_LIMIT = 5;

type ExampleConfig = {
  apiKey: string;
  backendUrl: string;
  limit: number;
};

export class EnvironmentVariableNotSetError extends Error {
  constructor(variableName: string) {
    super(`${variableName} is required`);
    this.name = 'EnvironmentVariableNotSetError';
  }
}

function getRequiredEnv(env: NodeJS.ProcessEnv, variableName: string) {
  const value = env[variableName]?.trim();

  if (!value) {
    throw new EnvironmentVariableNotSetError(variableName);
  }

  return value;
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function determineNextExecutionDate(executeAt: number, referenceDate = new Date()) {
  const currentMonthExecutionDate = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), executeAt),
  );

  if (referenceDate.getUTCDate() < executeAt) {
    return currentMonthExecutionDate;
  }

  return new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, executeAt));
}

export function formatPaymentDetails(
  payment: TExpandedTransaction | TExpandedRecurringPayment,
  referenceDate = new Date(),
) {
  const details: string[] = [];

  if ('processedAt' in payment) {
    details.push(`date ${formatDate(payment.processedAt)}`);
  }

  if ('executeAt' in payment) {
    details.push(`execution day ${payment.executeAt}`);

    if (payment.paused) {
      details.push('paused');
    } else {
      details.push(`next execution ${formatDate(determineNextExecutionDate(payment.executeAt, referenceDate))}`);
    }
  }

  if (payment.information) {
    details.push(`note ${payment.information}`);
  }

  return details.join('; ');
}

export function readConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ExampleConfig {
  const limit = Number(env.BUDGETBUDDY_RESULT_LIMIT ?? DEFAULT_RESULT_LIMIT);

  return {
    apiKey: getRequiredEnv(env, 'BUDGETBUDDY_API_KEY'),
    backendUrl: getRequiredEnv(env, 'BUDGETBUDDY_BACKEND_URL'),
    limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_RESULT_LIMIT,
  };
}

export function createApiKeyRequestConfig(apiKey: string): RequestInit {
  return {
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
  };
}

export async function fetchBudgetBuddyOverview(config: ExampleConfig) {
  const api = new Api(config.backendUrl);
  const requestConfig = createApiKeyRequestConfig(config.apiKey);
  const query = {
    from: 0,
    to: config.limit,
  };

  const [transactions, transactionError] = await api.backend.transaction.getAll(query, requestConfig);
  if (transactionError) {
    throw transactionError;
  }

  const [recurringPayments, recurringPaymentError] = await api.backend.recurringPayment.getAll(query, requestConfig);
  if (recurringPaymentError) {
    throw recurringPaymentError;
  }

  return {
    recurringPayments: recurringPayments.data ?? [],
    transactions: transactions.data ?? [],
  };
}

function printPayments(title: string, payments: Array<TExpandedTransaction | TExpandedRecurringPayment>) {
  console.log(`\n${title}`);

  if (payments.length === 0) {
    console.log('No entries found.');
    return;
  }

  for (const payment of payments) {
    const category = payment.category?.name ?? 'No category';
    const paymentMethod = payment.paymentMethod?.name ?? 'No payment method';
    const details = formatPaymentDetails(payment);
    const detailsSuffix = details ? ` - ${details}` : '';
    console.log(
      `- ${payment.receiver}: ${payment.transferAmount.toFixed(2)} EUR (${category}, ${paymentMethod})${detailsSuffix}`,
    );
  }
}

export async function main() {
  const config = readConfigFromEnv();
  const overview = await fetchBudgetBuddyOverview(config);

  console.log(`BudgetBuddyDE API example using ${config.backendUrl}`);
  printPayments('Transactions', overview.transactions);
  printPayments('Recurring payments', overview.recurringPayments);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
