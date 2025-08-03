'use client';

import { Box } from '@mui/material';
import React from 'react';

import { Card } from '@/components/Card';
import { PieChart, type PieChartData } from '@/components/Charts';
import { NoResults } from '@/components/NoResults';
import { Formatter } from '@/utils/Formatter';

export type PortfolioDiversityChartProps = {
  positions: any[];
};

export const PortfolioDiversityChart: React.FC<PortfolioDiversityChartProps> = ({ positions }) => {
  const preparedData: PieChartData[] = React.useMemo(() => {
    const groupedData: Record<string, { label: string; total: number }> = {};
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Object.entries(groupedData).map(([_, { label, total }]) => ({
      label: label,
      value: total,
    }));
  }, [positions]);

  // const colorRange: string[] = React.useMemo(() => {
  //   return generateHslColorScale(theme.palette.primary.dark, theme.palette.primary.light, preparedData.length);
  // }, [preparedData]);

  // const totalVolume: number = React.useMemo(() => {
  //   return preparedData.reduce((acc, curr) => acc + curr.value, 0);
  // }, [preparedData]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Positions</Card.Title>
          <Card.Subtitle>How are you positions allocated?</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{ pt: 1 }}>
        {preparedData.length > 0 ? (
          <PieChart
            fullWidth
            primaryText={Formatter.currency.formatBalance(
              preparedData.reduce((acc, curr) => acc + curr.value, 0)
            )}
            secondaryText="Total"
            series={[
              {
                data: preparedData.map((v) => ({ value: v.value, label: v.label })),
                valueFormatter: (value) => Formatter.currency.formatBalance(value.value),
                innerRadius: 110,
                paddingAngle: 1,
                cornerRadius: 5,
                // REVISIT:
                // highlightScope: {faded: 'global', highlighted: 'item'},
              },
            ]}
          />
        ) : (
          <NoResults text="No stock-positions found!" />
        )}
      </Card.Body>
      {/* <Card.Body>
        {preparedData
          .map((pos, idx) => ({
            label: pos.label,
            value: parseFloat(((pos.value * 100) / totalVolume).toFixed(2)),
            color: colorRange[idx],
          }))
          .map((pos, idx) => (
            <Stack key={idx} direction="row" sx={{alignItems: 'center', gap: 2, pb: 2}}>
              <Stack sx={{gap: 1, flexGrow: 1}}>
                <Stack direction="row" justifyContent={'space-between'} alignItems={'center'} gap={2}>
                  <Typography variant="body2" sx={{fontWeight: '500'}} noWrap>
                    {pos.label}
                  </Typography>
                  <Typography variant="body2" sx={{color: 'text.secondary'}}>
                    {pos.value}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  aria-label="Number of users by country"
                  value={pos.value}
                  sx={{
                    [`& .${linearProgressClasses.bar}`]: {
                      backgroundColor: pos.color,
                    },
                  }}
                />
              </Stack>
            </Stack>
          ))}
      </Card.Body> */}
    </Card>
  );
};
