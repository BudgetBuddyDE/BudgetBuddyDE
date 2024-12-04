import {styled} from '@mui/material';
import {useDrawingArea} from '@mui/x-charts/hooks';
import React from 'react';

type TStyledTextProps = {
  variant: 'primary' | 'secondary';
};

const StyledText = styled('text', {
  shouldForwardProp: prop => prop !== 'variant',
})<TStyledTextProps>(({theme}) => ({
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fill: theme.palette.text.secondary,
  variants: [
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontSize: theme.typography.h5.fontSize,
      },
    },
    {
      props: ({variant}) => variant !== 'primary',
      style: {
        fontSize: theme.typography.body2.fontSize,
      },
    },
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontWeight: theme.typography.h5.fontWeight,
      },
    },
    {
      props: ({variant}) => variant !== 'primary',
      style: {
        fontWeight: theme.typography.body2.fontWeight,
      },
    },
  ],
}));

export type TPieCenterLabelProps = {
  primaryText?: string;
  secondaryText?: string;
};

export const PieCenterLabel: React.FC<TPieCenterLabelProps> = ({primaryText, secondaryText}) => {
  const {width, height, left, top} = useDrawingArea();
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
