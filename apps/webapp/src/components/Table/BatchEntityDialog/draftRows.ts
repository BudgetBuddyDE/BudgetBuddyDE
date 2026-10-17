/** Drafts contain plain data and dates; retain their value types in the snapshot. */
export const cloneDraftValue = <T>(value: T): T => {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map(item => cloneDraftValue(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneDraftValue(item)])) as T;
  }
  return value;
};

/** Compare draft values without treating cloned dates as changes. */
export const draftRowsEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return Object.is(left.getTime(), right.getTime());
  if (left instanceof Date || right instanceof Date) return false;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => draftRowsEqual(value, right[index]));
  }
  if (Array.isArray(left) || Array.isArray(right)) return false;
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    const leftValues = Object.entries(left);
    const rightValues = Object.fromEntries(Object.entries(right));
    return (
      leftValues.length === Object.keys(right).length &&
      leftValues.every(([key, value]) => Object.hasOwn(right, key) && draftRowsEqual(value, rightValues[key]))
    );
  }
  return false;
};
