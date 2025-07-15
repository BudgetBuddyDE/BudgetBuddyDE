import {Chip, type ChipProps} from '@mui/material';
import React from 'react';

import {type TPaymentMethod} from '@/newTypes';

import {usePaymentMethods} from '../usePaymentMethods.hook';

export type TPaymentMethodChipProps = ChipProps & {paymentMethod: TPaymentMethod | string};

export const PaymentMethodChip: React.FC<TPaymentMethodChipProps> = ({paymentMethod, ...otherProps}) => {
  const {isLoading, data: paymentMethods} = usePaymentMethods();

  if (isLoading) return null;
  return (
    <Chip
      label={
        typeof paymentMethod === 'string'
          ? (paymentMethods?.find(({ID}) => ID === paymentMethod)?.name ?? '')
          : paymentMethod.name
      }
      variant="outlined"
      {...otherProps}
    />
  );
};
