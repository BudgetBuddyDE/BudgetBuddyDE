export interface IGetHistoricalBalanceQuery {
  $dateFrom?: Date;
  $dateTo?: Date;
}

export interface IGetInsightsReportQuery extends IGetHistoricalBalanceQuery {
  $categories?: string[];
  $paymentMethods?: string[];
  $granularity?: 'auto' | 'day' | 'week' | 'month';
  $comparison?: 'previous' | 'none';
}
