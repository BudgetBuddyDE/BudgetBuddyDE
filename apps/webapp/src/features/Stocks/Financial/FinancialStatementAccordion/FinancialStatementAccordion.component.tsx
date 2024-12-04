import React from 'react';

import {type TBarChartProps} from '@/components/Base/Charts';
import {useScreenSize} from '@/hooks/useScreenSize';
import {Formatter} from '@/services/Formatter';

import {StockService} from '../../StockService';
import {FinancialStatement} from './FinancialStatement/FinancialStatement.component';
import {ProfitLoss} from './ProfitLoss';

export enum EFinancialStatementTimeframe {
  Yearly = 0,
  Quarterly = 1,
}

export type TFinancialStatementAccordionProps = {
  stockDetails: Awaited<ReturnType<typeof StockService.getAssetDetails>>[0];
};

export const FinancialStatementAccordion: React.FC<TFinancialStatementAccordionProps> = ({stockDetails}) => {
  const screenSize = useScreenSize();
  const barChartProps: Partial<TBarChartProps> = {
    yAxis: [
      {
        valueFormatter: value => Formatter.shortenNumber(value ?? 0),
      },
    ],
    height: screenSize === 'small' ? 230 : 300,
    margin: {left: 80, right: 20, top: 20, bottom: 20},
    grid: {horizontal: true},
  };
  const barChartSeriesFormatter = (value: number | null) => Formatter.shortenNumber(value ?? 0);

  return (
    <React.Fragment>
      <ProfitLoss stockDetails={stockDetails} barChartProps={barChartProps} seriesFormatter={barChartSeriesFormatter} />
      <FinancialStatement
        stockDetails={stockDetails}
        barChartProps={barChartProps}
        seriesFormatter={barChartSeriesFormatter}
      />
    </React.Fragment>
  );
};
