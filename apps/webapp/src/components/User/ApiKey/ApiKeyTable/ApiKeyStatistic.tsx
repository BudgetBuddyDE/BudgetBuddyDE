import {Box, Skeleton, Tooltip, Typography} from '@mui/material';

export type ApiKeyStatisticProps = {
  label: string;
  value: string | number | null;
  valueTooltip?: string;
};

export const ApiKeyStatistic: React.FC<ApiKeyStatisticProps> = ({label, value, valueTooltip}) => {
  return (
    <Box
      sx={{
        minWidth: 0,
        px: {xs: 0, sm: 2},
        py: {xs: 1, sm: 0},
      }}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="h6" sx={{fontWeight: 500}}>
        {value === null ? (
          <Skeleton width={label === 'Last created' ? 180 : 48} />
        ) : valueTooltip ? (
          <Tooltip title={valueTooltip}>
            <Box component="span">{value}</Box>
          </Tooltip>
        ) : (
          value
        )}
      </Typography>
    </Box>
  );
};
