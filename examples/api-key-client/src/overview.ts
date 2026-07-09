import {Api} from '@budgetbuddyde/api';
import type {TExpandedRecurringPayment, TExpandedTransaction} from '@budgetbuddyde/api/types';
import {createApiKeyRequestConfig} from './auth';
import {fetchExportEntity} from './export';
import type {CliLogger} from './logger';
import type {ExampleConfig} from './types';

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

export async function fetchBudgetBuddyOverview(config: ExampleConfig, logger?: CliLogger) {
  const api = new Api(config.backendUrl);
  const requestConfig = createApiKeyRequestConfig(config.apiKey);

  logger?.info('Fetching BudgetBuddyDE overview', {backendUrl: config.backendUrl, limit: config.limit});

  const transactions = await fetchExportEntity(api, 'transactions', requestConfig, config.limit);
  const recurringPayments = await fetchExportEntity(api, 'recurringPayments', requestConfig, config.limit);

  logger?.debug('Fetched overview data', {
    transactions: transactions.length,
    recurringPayments: recurringPayments.length,
  });

  return {
    recurringPayments: recurringPayments as TExpandedRecurringPayment[],
    transactions: transactions as TExpandedTransaction[],
  };
}

export function printPayments(title: string, payments: Array<TExpandedTransaction | TExpandedRecurringPayment>) {
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
