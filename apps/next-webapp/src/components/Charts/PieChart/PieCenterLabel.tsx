'use client';

import { styled } from '@mui/material';
import { useDrawingArea } from '@mui/x-charts/hooks';
import React from 'react';

const StyledText = styled('text', {
  shouldForwardProp: (prop) => prop !== 'variant',
})<{
  variant: 'primary' | 'secondary';
}>(({ theme }) => ({
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fill: theme.palette.text.primary,
  variants: [
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontSize: theme.typography.h5.fontSize,
        fontWeight: theme.typography.h5.fontWeight,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontSize: theme.typography.body2.fontSize,
        fontWeight: theme.typography.body2.fontWeight,
      },
    },
  ],
}));

export type PieCenterLabelProps = {
  primaryText?: string;
  secondaryText?: string;
};

export const PieCenterLabel: React.FC<PieCenterLabelProps> = ({ primaryText, secondaryText }) => {
  const { width, height, left, top } = useDrawingArea();
  const primaryY = top + height / 2 - 10;
  const secondaryY = primaryY + 24;

  return (
    <React.Fragment>
      <StyledText variant="primary" x={left + width / 2} y={primaryY}>
        {primaryText}
      </StyledText>
      <StyledText variant="secondary" x={left + width / 2} y={secondaryY}>
        {secondaryText}
      </StyledText>
    </React.Fragment>
  );
};
