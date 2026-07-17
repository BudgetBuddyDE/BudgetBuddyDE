export function parseListQuery(params: Record<string, string | string[] | undefined>): {
  search: string;
  page: number;
  pageSize: number;
} {
  const value = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const page = Number(value('page'));
  const pageSize = Number(value('pageSize'));
  return {
    search: (value('search') ?? '').slice(0, 100),
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: [10, 25, 50, 100].includes(pageSize) ? pageSize : 25,
  };
}
