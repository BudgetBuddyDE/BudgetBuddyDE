/** Runs `mapper` over `items` with at most `concurrency` promises in flight. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(
    Array.from({length: workerCount}, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await mapper(items[index], index);
      }
    }),
  );
  return results;
}

/** Like `mapWithConcurrency`, but returns a settled result per item instead of rejecting. */
export async function mapWithConcurrencySettled<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  return mapWithConcurrency(items, concurrency, async (item, index): Promise<PromiseSettledResult<R>> => {
    try {
      return {status: 'fulfilled', value: await mapper(item, index)};
    } catch (reason) {
      return {status: 'rejected', reason};
    }
  });
}
