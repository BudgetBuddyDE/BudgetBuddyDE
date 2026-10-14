import {Box, Typography} from '@mui/material';

export type ApiKeyDetailProps = {
  label: string;
  value: string;
  valueInformation?: string;
};

export const ApiKeyDetail: React.FC<ApiKeyDetailProps> = ({label, value, valueInformation}) => (
  <Box>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
    {valueInformation && (
      <Typography color="text.secondary" variant="caption">
        {valueInformation}
      </Typography>
    )}
  </Box>
);
