export type WaterfallInput = {label: string; value: number; isTotal?: boolean};

/** Floating ranges stay correct when a cash flow crosses zero. */
export function buildWaterfall(data: WaterfallInput[]) {
  let balance = 0;
  return data.map(point => {
    const start = point.isTotal ? 0 : balance;
    const end = point.isTotal ? point.value : balance + point.value;
    balance = end;
    return {
      ...point,
      range: [Math.min(start, end), Math.max(start, end)] as [number, number],
      balance,
      kind: point.isTotal ? 'total' : point.value >= 0 ? 'increase' : 'decrease',
    };
  });
}
