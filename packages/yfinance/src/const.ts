export const QUERY1_URL = 'https://query1.finance.yahoo.com';
export const BASE_URL = 'https://query2.finance.yahoo.com';
export const ROOT_URL = 'https://finance.yahoo.com';

export const QUOTE_SUMMARY_MODULES = [
  'summaryProfile', // contains general information about the company
  'summaryDetail', // prices + volume + market cap + etc
  'assetProfile', // summaryProfile + company officers
  'fundProfile',
  'price', // current prices
  'quoteType', // quoteType
  'esgScores', // Environmental, social, and governance (ESG) scores, sustainability and ethical performance of companies
  'incomeStatementHistory',
  'incomeStatementHistoryQuarterly',
  'balanceSheetHistory',
  'balanceSheetHistoryQuarterly',
  'cashFlowStatementHistory',
  'cashFlowStatementHistoryQuarterly',
  'defaultKeyStatistics', // KPIs (PE, enterprise value, EPS, EBITA, and more)
  'financialData', // Financial KPIs (revenue, gross margins, operating cash flow, free cash flow, and more)
  'calendarEvents', // future earnings date
  'secFilings', // SEC filings, such as 10K and 10Q reports
  'upgradeDowngradeHistory', // upgrades and downgrades that analysts have given a company's stock
  'institutionOwnership', // institutional ownership, holders and shares outstanding
  'fundOwnership', // mutual fund ownership, holders and shares outstanding
  'majorDirectHolders',
  'majorHoldersBreakdown',
  'insiderTransactions', // insider transactions, such as the number of shares bought and sold by company executives
  'insiderHolders', // insider holders, such as the number of shares held by company executives
  'netSharePurchaseActivity', // net share purchase activity, such as the number of shares bought and sold by company executives
  'earnings', // earnings history
  'earningsHistory',
  'earningsTrend', // earnings trend
  'industryTrend',
  'indexTrend',
  'sectorTrend',
  'recommendationTrend',
  'futuresChain',
];
