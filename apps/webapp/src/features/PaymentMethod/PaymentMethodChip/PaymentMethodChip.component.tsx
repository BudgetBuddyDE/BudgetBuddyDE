import {Chip, type ChipProps} from '@mui/material';
import React from 'react';

import {type TPaymentMethod} from '@/newTypes';

export type TPaymentMethodChipProps = ChipProps & {paymentMethod: TPaymentMethod};

export const PaymentMethodChip: React.FC<TPaymentMethodChipProps> = ({paymentMethod, ...otherProps}) => {
  return <Chip label={paymentMethod.name} variant="outlined" {...otherProps} />;
};
