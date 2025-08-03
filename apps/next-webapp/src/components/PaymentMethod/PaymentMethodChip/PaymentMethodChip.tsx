import { Chip, type ChipProps } from '@mui/material';
import React from 'react';

export type PaymentMethodChipProps = ChipProps & { paymentMethodName: string };

export const PaymentMethodChip: React.FC<PaymentMethodChipProps> = ({
  paymentMethodName,
  ...otherProps
}) => {
  return <Chip label={paymentMethodName} variant="outlined" {...otherProps} />;
};
