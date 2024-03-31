import React from 'react';
import { Box } from '@mui/material';
import { ParentSize } from '@visx/responsive';
import { Card, NoResults, type TPieChartData } from '@/components/Base';
import { type TStockPosition } from '@budgetbuddyde/types';
import { ApexPieChart } from '../Base/Charts/ApexPieChart.component';

export type TPortfolioDiversityChartProps = {
  positions: TStockPosition[];
};

export const PortfolioDiversityChart: React.FC<TPortfolioDiversityChartProps> = ({ positions }) => {
  const preparedData: TPieChartData[] = React.useMemo(() => {
    let groupedData: Record<string, { label: string; total: number }> = {};
    for (const position of positions) {
      if (groupedData[position.isin]) {
        groupedData[position.isin].total += position.quantity * position.quote.price;
      } else {
        groupedData[position.isin] = {
          label: position.name,
          total: position.quantity * position.quote.price,
        };
      }
    }
    return Object.entries(groupedData).map(([_, { label, total }]) => ({
      label: label,
      value: total,
    }));
  }, [positions]);

  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ p: 2, pb: 0 }}>
        <Box>
          <Card.Title>Positions</Card.Title>
          <Card.Subtitle>How is your portfolio structured?</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        {preparedData.length > 0 ? (
          <Box sx={{ display: 'flex', flex: 1, mt: '1rem', flexDirection: 'column' }}>
            <ParentSize>
              {({ width }) => <ApexPieChart width={width} height={width} data={preparedData} />}
            </ParentSize>
          </Box>
        ) : (
          <NoResults text="No positions provided" sx={{ mt: 2 }} />
        )}
      </Card.Body>
    </Card>
  );
};
