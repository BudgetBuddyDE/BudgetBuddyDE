import {describe, expect, it} from 'vite-plus/test';
import {buildWaterfall} from './waterfall';

describe('cash flow ranges', () => {
  it('preserves directed changes across zero and reports actual closing balances', () => {
    const rows = buildWaterfall([
      {label: 'Start', value: 100, isTotal: true},
      {label: 'Bill', value: -150},
      {label: 'Refund', value: 80},
    ]);
    expect(rows.map(row => row.range)).toEqual([
      [0, 100],
      [-50, 100],
      [-50, 30],
    ]);
    expect(rows.map(row => row.balance)).toEqual([100, -50, 30]);
    expect(rows[1].value).toBe(-150);
  });
  it('supports negative totals without an invisible offset series', () => {
    const rows = buildWaterfall([
      {label: 'Start', value: -200, isTotal: true},
      {label: 'Bill', value: -100},
      {label: 'End', value: -300, isTotal: true},
    ]);
    expect(rows.map(row => row.range)).toEqual([
      [-200, 0],
      [-300, -200],
      [-300, 0],
    ]);
  });
});
