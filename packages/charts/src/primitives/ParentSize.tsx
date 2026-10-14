'use client';

import {styled} from '@mui/material/styles';
import React from 'react';
import {categoricalColors, darkCategoricalColors} from '../theme/chartTheme';

// FIXME: Check for better alternatives
const Container = styled('div')(({theme}) => ({
  width: '100%',
  minWidth: 0,
  fontFamily: theme.typography.fontFamily,
  fontVariantNumeric: 'tabular-nums',
  '--bb-chart-balance': '#2563EB',
  '--bb-chart-income': '#0F766E',
  '--bb-chart-expense': '#C2410C',
  '--bb-chart-target': '#64748B',
  '--bb-chart-warning': '#B42318',
  '--bb-chart-heat-low': '#EFF6FF',
  '--bb-chart-heat-high': '#1D4ED8',
  '--bb-chart-on-color': '#FFFFFF',
  ...Object.fromEntries(categoricalColors.map((color, index) => [`--bb-chart-series-${index}`, color])),
  '& svg': {fontFamily: 'inherit', overflow: 'visible'},
  '& :focus-visible': {outline: `2px solid ${(theme.vars ?? theme).palette.primary.main}`, outlineOffset: 3},
  ...theme.applyStyles('dark', {
    '--bb-chart-balance': '#82B4FF',
    '--bb-chart-income': '#5EEAD4',
    '--bb-chart-expense': '#FDBA74',
    '--bb-chart-target': '#CBD5E1',
    '--bb-chart-warning': '#FDA4AF',
    '--bb-chart-heat-low': '#163451',
    '--bb-chart-heat-high': '#82B4FF',
    '--bb-chart-on-color': '#001E3C',
    ...Object.fromEntries(darkCategoricalColors.map((color, index) => [`--bb-chart-series-${index}`, color])),
  }),
}));

export type ParentSizeProps = {
  children: (size: {width: number; height: number}) => React.ReactNode;
  /** Fixed width is capped to the measured container width to prevent mobile overflow. */
  width?: number;
  className?: string;
};

export const ParentSize: React.FC<ParentSizeProps> = ({children, width, className}) => {
  const [size, setSize] = React.useState({width: 0, height: 0});
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateSize = () => {
      const next = {width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height};
      setSize(previous => (previous.width === next.width && previous.height === next.height ? previous : next));
    };
    updateSize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : undefined;
    observer?.observe(element);
    window.addEventListener('resize', updateSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);
  const resolvedWidth = width === undefined ? size.width : size.width > 0 ? Math.min(width, size.width) : width;
  return (
    <Container ref={containerRef} className={className}>
      {children({...size, width: resolvedWidth})}
    </Container>
  );
};
