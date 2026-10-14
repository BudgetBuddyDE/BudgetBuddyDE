import type {ValueFormatter} from '@budgetbuddyde/charts';
import {Formatter} from '@/utils/Formatter';

export const formatCurrency: ValueFormatter = value => Formatter.currency.formatBalance(value);
export const formatCompactCurrency: ValueFormatter = value => Formatter.currency.shortenBalance(value);
export const formatPercent: ValueFormatter = value => `${Math.round(value)}%`;

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const INCOME = [3200, 3250, 3100, 3400, 3600, 3550, 3700, 3650, 3800, 3900, 3850, 4100];
const EXPENSES = [2100, 2250, 2000, 3830, 2600, 2500, 2700, 2450, 4310, 2900, 2750, 3000];

export const cashflow = MONTHS.map((month, index) => ({
  month,
  income: INCOME[index],
  expenses: EXPENSES[index],
  net: INCOME[index] - EXPENSES[index],
}));

export const balanceTrend = (() => {
  let running = 5200;
  return MONTHS.map((month, index) => {
    running += INCOME[index] - EXPENSES[index];
    return {month, balance: running};
  });
})();

export const averageBalance =
  balanceTrend.reduce((accumulator, row) => accumulator + row.balance, 0) / balanceTrend.length;

export const CATEGORIES = ['Housing', 'Groceries', 'Transport', 'Leisure', 'Insurance'];
const CATEGORY_BASE = [1450, 620, 280, 340, 210];

export const categoryStack = MONTHS.map((month, index) => {
  const row: Record<string, string | number> = {month};
  CATEGORIES.forEach((category, categoryIndex) => {
    const base = CATEGORY_BASE[categoryIndex];
    row[category] = Math.round(base * (1 + Math.sin((index + categoryIndex) / 2) * 0.18));
  });
  return row;
});

export const spendingByCategory = CATEGORIES.map((label, index) => ({
  label,
  value: CATEGORY_BASE[index] * 12,
}));

export const incomeBySource = [
  {label: 'Salary', value: 42000, color: 'var(--bb-chart-series-0)'},
  {label: 'Side income', value: 6200, color: 'var(--bb-chart-series-1)'},
  {label: 'Investments', value: 2400, color: 'var(--bb-chart-series-2)'},
  {label: 'Refunds', value: 900, color: 'var(--bb-chart-series-3)'},
];

export const budgetVsActual = CATEGORIES.map((category, index) => ({
  category,
  budget: CATEGORY_BASE[index] * 12,
  actual: Math.round(CATEGORY_BASE[index] * 12 * (0.85 + (index % 3) * 0.12)),
}));

export const budgetRadar = CATEGORIES.map((metric, index) => ({
  metric,
  Goal: CATEGORY_BASE[index],
  Actual: Math.round(CATEGORY_BASE[index] * (0.85 + (index % 3) * 0.12)),
}));

export const budgetUsage = CATEGORIES.map((label, index) => ({
  label,
  value: Math.min(100, 60 + index * 9),
}));

export const transactionsScatter = Array.from({length: 40}, (_, index) => ({
  x: index + 1,
  y: Math.round(20 + Math.abs(Math.sin(index / 3)) * 320 + (index % 4) * 15),
}));

export const recurringScatter = Array.from({length: 12}, (_, index) => ({
  x: index + 1,
  y: Math.round(120 + Math.abs(Math.cos(index / 2)) * 220),
}));

export const accountBubble = [
  {x: 12, y: 1450, z: 1450},
  {x: 28, y: 860, z: 860},
  {x: 44, y: 2400, z: 2400},
  {x: 61, y: 620, z: 620},
  {x: 78, y: 1980, z: 1980},
];

export const spendingTreemap = [
  {
    name: 'Housing',
    children: [
      {name: 'Rent', value: 1200},
      {name: 'Utilities', value: 250},
    ],
  },
  {
    name: 'Living',
    children: [
      {name: 'Groceries', value: 620},
      {name: 'Transport', value: 280},
      {name: 'Leisure', value: 340},
    ],
  },
  {name: 'Insurance', value: 210},
];

export const spendingSunburst = {
  name: 'Spending',
  children: [
    {
      name: 'Housing',
      children: [
        {name: 'Rent', value: 1200},
        {name: 'Utilities', value: 250},
      ],
    },
    {
      name: 'Living',
      children: [
        {name: 'Groceries', value: 620},
        {name: 'Transport', value: 280},
        {name: 'Leisure', value: 340},
      ],
    },
    {name: 'Insurance', value: 210},
  ],
};

export const moneyFlow = {
  nodes: [
    {name: 'Salary'},
    {name: 'Side income'},
    {name: 'Housing'},
    {name: 'Living'},
    {name: 'Savings'},
    {name: 'Rent'},
    {name: 'Utilities'},
    {name: 'Groceries'},
    {name: 'Leisure'},
  ],
  links: [
    {source: 0, target: 2, value: 1450},
    {source: 0, target: 3, value: 1200},
    {source: 0, target: 4, value: 900},
    {source: 1, target: 3, value: 200},
    {source: 2, target: 5, value: 1200},
    {source: 2, target: 6, value: 250},
    {source: 3, target: 7, value: 800},
    {source: 3, target: 8, value: 600},
  ],
};

export const budgetFunnel = [
  {name: 'Submitted claims', value: 3000},
  {name: 'Eligible claims', value: 2400},
  {name: 'Approved claims', value: 2100},
  {name: 'Paid claims', value: 1900},
];

export const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const HEATMAP_WEEKS = ['W1', 'W2', 'W3', 'W4'];
export const spendingHeatmap = HEATMAP_WEEKS.flatMap((week, weekIndex) =>
  HEATMAP_DAYS.map((day, dayIndex) => ({
    x: day,
    y: week,
    value: Math.round(20 + Math.abs(Math.sin((weekIndex + 1) * (dayIndex + 1) * 0.7)) * 180),
  })),
);

export const waterfallData = [
  {label: 'Start', value: 5200, isTotal: true},
  {label: 'Income', value: 3800},
  {label: 'Rent', value: -1200},
  {label: 'Groceries', value: -650},
  {label: 'Leisure', value: -400},
  {label: 'Savings', value: -900},
  {label: 'End', value: 5850, isTotal: true},
];

export const bulletBudgets = CATEGORIES.map((label, index) => ({
  label,
  actual: Math.round(CATEGORY_BASE[index] * 12 * (0.7 + (index % 3) * 0.14)),
  target: CATEGORY_BASE[index] * 12,
  max: Math.round(CATEGORY_BASE[index] * 12 * 1.3),
}));

export const portfolioPrices = [
  {label: 'W1', open: 120, high: 128, low: 117, close: 125},
  {label: 'W2', open: 125, high: 131, low: 122, close: 123},
  {label: 'W3', open: 123, high: 127, low: 118, close: 126},
  {label: 'W4', open: 126, high: 134, low: 124, close: 132},
  {label: 'W5', open: 132, high: 139, low: 130, close: 137},
  {label: 'W6', open: 137, high: 138, low: 129, close: 131},
  {label: 'W7', open: 131, high: 135, low: 127, close: 134},
  {label: 'W8', open: 134, high: 142, low: 133, close: 141},
  {label: 'W9', open: 141, high: 145, low: 137, close: 139},
  {label: 'W10', open: 139, high: 148, low: 138, close: 147},
];

export const balanceSparkline = [8200, 8420, 8310, 8600, 8790, 8650, 9010, 9180, 9040, 9320, 9600, 9780];
export const expensesSparkline = [2100, 2250, 2000, 2400, 2600, 2500, 2700, 2450, 2800, 2900, 2750, 3000];
