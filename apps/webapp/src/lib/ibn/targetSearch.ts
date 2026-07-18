import {apiClient} from '@/apiClient';
import {authClient} from '@/authClient';
import {Formatter} from '@/utils/Formatter';
import type {IntentEntity} from './types';

/** Search result that can be selected as an edit or delete intent target. */
export type IntentTargetOption = {id: string; label: string; description?: string; keywords?: string[]};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const withUuidFallback = (query: string, options: IntentTargetOption[]) => {
  const trimmedQuery = query.trim();
  if (!UUID_PATTERN.test(trimmedQuery) || options.some(option => option.id === trimmedQuery)) return options;
  return [...options, {id: trimmedQuery, label: `Use ID "${trimmedQuery}"`, keywords: [trimmedQuery]}];
};

/**
 * Searches records for a given entity and normalizes them for the command palette.
 *
 * A valid UUID is offered as a fallback target when it is not returned by the
 * entity search endpoint.
 */
export async function searchIntentTargets(entity: IntentEntity, query: string): Promise<IntentTargetOption[]> {
  const search = query.trim();
  let options: IntentTargetOption[] = [];

  switch (entity) {
    case 'transaction': {
      const [result, error] = await apiClient.backend.transaction.getAll({
        search: search || undefined,
        from: 0,
        to: 10,
      });
      if (error) throw new Error(error.message);
      options = (result?.data ?? []).map(transaction => ({
        id: transaction.id,
        label: `${transaction.receiver} · ${Formatter.currency.formatBalance(transaction.transferAmount)} · ${Formatter.date.format(transaction.processedAt)}`,
        description: transaction.information ?? undefined,
        keywords: [
          transaction.receiver,
          transaction.category.name,
          transaction.paymentMethod.name,
          transaction.information ?? '',
        ],
      }));
      break;
    }
    case 'recurringPayment': {
      const [result, error] = await apiClient.backend.recurringPayment.getAll({
        search: search || undefined,
        from: 0,
        to: 10,
      });
      if (error) throw new Error(error.message);
      options = (result?.data ?? []).map(payment => ({
        id: payment.id,
        label: `${payment.receiver} · ${Formatter.currency.formatBalance(payment.transferAmount)} · day ${payment.executeAt}`,
        description: payment.information ?? undefined,
        keywords: [payment.receiver, payment.category.name, payment.paymentMethod.name, payment.information ?? ''],
      }));
      break;
    }
    case 'category': {
      const [result, error] = await apiClient.backend.category.getAll({search: search || undefined, from: 0, to: 10});
      if (error) throw new Error(error.message);
      options = (result?.data ?? []).map(category => ({
        id: category.id,
        label: category.name,
        description: category.description ?? undefined,
        keywords: [category.name, category.description ?? ''],
      }));
      break;
    }
    case 'paymentMethod': {
      const [result, error] = await apiClient.backend.paymentMethod.getAll({
        search: search || undefined,
        from: 0,
        to: 10,
      });
      if (error) throw new Error(error.message);
      options = (result?.data ?? []).map(paymentMethod => ({
        id: paymentMethod.id,
        label: `${paymentMethod.name} · ${paymentMethod.provider}`,
        description: paymentMethod.description ?? paymentMethod.address,
        keywords: [paymentMethod.name, paymentMethod.provider, paymentMethod.address, paymentMethod.description ?? ''],
      }));
      break;
    }
    case 'budget': {
      const [result, error] = await apiClient.backend.budget.getAll({search: search || undefined, from: 0, to: 10});
      if (error) throw new Error(error.message);
      options = (result?.data ?? []).map(budget => ({
        id: budget.id,
        label: budget.name,
        description: budget.description ?? undefined,
        keywords: [budget.name, budget.description ?? ''],
      }));
      break;
    }
    case 'attachment': {
      const [result, error] = await apiClient.backend.transaction.getAllTransactionAttachments({from: 0, to: 10});
      if (error) throw new Error(error.message);
      const normalizedSearch = search.toLowerCase();
      options = (result?.data ?? [])
        .filter(attachment => !normalizedSearch || attachment.fileName.toLowerCase().includes(normalizedSearch))
        .map(attachment => ({
          id: attachment.id,
          label: attachment.fileName,
          description: attachment.contentType,
          keywords: [attachment.fileName, attachment.fileExtension, attachment.contentType],
        }));
      break;
    }
    case 'apiKey': {
      const {data, error} = await authClient.apiKey.list({
        query: {limit: 10, offset: 0, sortBy: 'createdAt', sortDirection: 'desc'},
      });
      if (error) throw new Error(error.message ?? 'Failed to fetch API keys');
      const normalizedSearch = search.toLowerCase();
      options = ((data?.apiKeys ?? []) as Array<{id: string; name?: string | null}>)
        .filter(apiKey => {
          const name = apiKey.name ?? '';
          return !normalizedSearch || name.toLowerCase().includes(normalizedSearch);
        })
        .map(apiKey => ({
          id: apiKey.id,
          label: apiKey.name ?? apiKey.id,
          keywords: [apiKey.name ?? '', apiKey.id],
        }));
      break;
    }
  }

  return withUuidFallback(search, options);
}
