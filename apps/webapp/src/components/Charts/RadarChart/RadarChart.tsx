'use client';

import {RadarChart as MuiRadarChart, type RadarChartProps as MuiRadarChartProps, type RadarSeries} from '@mui/x-charts';
import React from 'react';
import {ParentSize} from '../ParentSize';

export type RadarChartSeries = Omit<RadarSeries, 'hideMark' | 'fillArea'>;

export type RadarChartProps = (
  | ({fullWidth: true} & Pick<MuiRadarChartProps, 'height'>)
  | ({fullWidth?: false} & Pick<MuiRadarChartProps, 'width' | 'height'>)
) & {
  showMarker?: boolean;
  fillArea?: boolean;
  series?: RadarChartSeries[];
} & Pick<MuiRadarChartProps, 'divisions' | 'shape' | 'highlight' | 'slotProps' | 'hideLegend' | 'radar' | 'margin'>;

// For styling: https://mui.com/x/react-charts/radar/#DemoRadar.tsx

export const RadarChart: React.FC<RadarChartProps> = ({
  fullWidth,
  showMarker = false,
  fillArea = false,
  series,
  radar,
  ...props
}) => {
  const modifiedSeries: RadarSeries[] = React.useMemo(() => {
    if (!series) return [];
    return series.map(s => ({
      ...s,
      hideMark: !showMarker,
      fillArea: fillArea,
    }));
  }, [series, showMarker, fillArea]);

  if (!props.hideLegend) props.hideLegend = true;
  if (fullWidth) {
    return (
      <ParentSize>
        {({width}) => <MuiRadarChart width={width} height={width} {...props} series={modifiedSeries} radar={radar} />}
      </ParentSize>
    );
  }
  return <MuiRadarChart {...props} series={modifiedSeries} radar={radar} />;
};
