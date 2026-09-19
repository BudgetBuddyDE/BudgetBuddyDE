import {format} from 'date-fns';

export type InsightsFilterOption = {id: string};

export function parseInsightsFilterIds(value: string | null): string[] {
  return (
    value
      ?.split(',')
      .map(id => id.trim())
      .filter(Boolean) ?? []
  );
}

export function selectInsightsFilterOptions<T extends InsightsFilterOption>(options: T[], ids: string[]): T[] {
  const optionsById = new Map(options.map(option => [option.id, option]));
  return ids.map(id => optionsById.get(id)).filter((option): option is T => option !== undefined);
}

export function haveSameInsightsFilterIds(
  current: readonly InsightsFilterOption[],
  next: readonly InsightsFilterOption[],
): boolean {
  return current.length === next.length && current.every((option, index) => option.id === next[index]?.id);
}

export function serializeInsightsSearchParams({
  from,
  to,
  granularity,
  comparison,
  categories,
  paymentMethods,
}: {
  from: Date;
  to: Date;
  granularity: string;
  comparison: string;
  categories: readonly InsightsFilterOption[];
  paymentMethods: readonly InsightsFilterOption[];
}): string {
  const params = new URLSearchParams();
  params.set('from', format(from, 'yyyy-MM-dd'));
  params.set('to', format(to, 'yyyy-MM-dd'));
  params.set('granularity', granularity);
  params.set('comparison', comparison);
  if (categories.length) params.set('cat', categories.map(category => category.id).join(','));
  if (paymentMethods.length) params.set('pm', paymentMethods.map(paymentMethod => paymentMethod.id).join(','));
  return params.toString();
}
