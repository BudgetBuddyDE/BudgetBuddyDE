import {useTheme} from '@mui/material';
import {PieChart as MuiPieChart, type PieChartProps as MuiPieChartProps} from '@mui/x-charts';
import React from 'react';

import {useScreenSize} from '@/hooks/useScreenSize';

import {ParentSize} from '../ParentSize';
import {PieCenterLabel} from './PieCenterLabel.component';

/**
 * Type definition for the props of the PieChart component.
 *
 * @remarks
 * This type extends the MuiPieChartProps type by omitting the 'children' property and adding some additional optional properties.
 *
 * @public
 */
export type TPieChartProps = Omit<MuiPieChartProps, 'children'> & {
  fullWidth?: boolean;
  primaryText?: string;
  secondaryText?: string;
};

/**
 * Renders a pie chart component.
 *
 * @component
 * @example
 * ```tsx
 * <PieChart
 *   fullWidth={true}
 *   primaryText="Primary Text"
 *   secondaryText="Secondary Text"
 *   series={[{ value: 10, label: "Label 1" }, { value: 20, label: "Label 2" }]}
 * />
 * ```
 *
 * @param {TPieChartProps} props - The props for the PieChart component.
 * @param {boolean} props.fullWidth - Whether the chart should take up the full width of its container. Default is `false`.
 * @param {string} props.primaryText - The primary text to be displayed in the center of the chart.
 * @param {string} props.secondaryText - The secondary text to be displayed in the center of the chart.
 * @param {Array<{ value: number, label: string }>} props.series - The data series for the chart.
 * @returns {JSX.Element} The rendered PieChart component.
 */
export const PieChart: React.FC<TPieChartProps> = ({fullWidth = false, primaryText, secondaryText, ...props}) => {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const defaultProps: Partial<MuiPieChartProps> = {
    slotProps: {
      legend: {
        hidden: true,
      },
    },
    margin: {left: 0, right: 0, top: 0, bottom: 0},
    skipAnimation: false,
  };

  const preparedData: typeof props.series = React.useMemo(() => {
    return props.series.map(item => ({
      innerRadius: screenSize === 'small' ? 90 : 110,
      paddingAngle: 1,
      cornerRadius: theme.shape.borderRadius,
      arcLabel: params => params.label ?? '',
      arcLabelMinAngle: 18,
      highlightScope: {faded: 'global', highlighted: 'item'},
      sortingValues(a, b) {
        return b - a;
      },
      ...item,
    }));
  }, [props.series]);

  return fullWidth ? (
    <ParentSize>
      {({width}) => (
        <MuiPieChart width={width} height={width} {...defaultProps} {...props} series={preparedData}>
          {(primaryText || secondaryText) && <PieCenterLabel primaryText={primaryText} secondaryText={secondaryText} />}
        </MuiPieChart>
      )}
    </ParentSize>
  ) : (
    <MuiPieChart {...defaultProps} {...props} series={preparedData}>
      {(primaryText || secondaryText) && <PieCenterLabel primaryText={primaryText} secondaryText={secondaryText} />}
    </MuiPieChart>
  );
};
