/** Resolve explicit category links and their current children, once per ID. */
export function effectiveCategoryIds<T extends string>(
  selected: readonly T[],
  categories: readonly {id: T; parentId?: T | null}[],
): Set<T> {
  const direct = new Set(selected);
  const effective = new Set(selected);
  for (const {id, parentId} of categories) {
    if (parentId && direct.has(parentId)) effective.add(id);
  }
  return effective;
}
