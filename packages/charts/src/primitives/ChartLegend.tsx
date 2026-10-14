'use client';

import {Box, ButtonBase, Stack, Typography} from '@mui/material';

export type ChartLegendItem = {key: string; label: string; color: string; dashed?: boolean; value?: string};

export type ChartLegendProps = {
  items: ChartLegendItem[];
  hiddenKeys?: string[];
  onToggle?: (key: string) => void;
};

/** HTML legend stays outside the plot so labels never steal its drawing area. */
export const ChartLegend: React.FC<ChartLegendProps> = ({items, hiddenKeys = [], onToggle}) => {
  return (
    <Stack
      component="ul"
      direction="row"
      useFlexGap
      spacing={2}
      sx={{listStyle: 'none', p: 0, m: 0, pb: 1.5, flexWrap: 'wrap'}}
      aria-label="Chart legend"
    >
      {items.map(item => (
        <Stack component="li" key={item.key} direction="row" spacing={0.75} sx={{alignItems: 'center'}}>
          <ButtonBase
            component={onToggle ? 'button' : 'span'}
            onClick={onToggle ? () => onToggle(item.key) : undefined}
            aria-pressed={onToggle ? !hiddenKeys.includes(item.key) : undefined}
            sx={{
              display: 'flex',
              gap: 0.75,
              alignItems: 'center',
              opacity: hiddenKeys.includes(item.key) ? 0.5 : 1,
              borderRadius: 0.5,
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 16,
                borderTop: '3px',
                borderTopStyle: item.dashed ? 'dashed' : 'solid',
                borderColor: item.color,
              }}
            />
            <Typography component="span" variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            {item.value && (
              <Typography component="span" variant="body2" sx={{fontWeight: 600}}>
                {item.value}
              </Typography>
            )}
          </ButtonBase>
        </Stack>
      ))}
    </Stack>
  );
};
