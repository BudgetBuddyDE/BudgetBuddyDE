import {Chip, type ChipProps} from '@mui/material';
import React from 'react';

import {useFilterStore} from '@/components/Filter';
import {type TPaymentMethod} from '@/newTypes';

export type TPaymentMethodChipProps = ChipProps & {paymentMethod: TPaymentMethod};

export const PaymentMethodChip: React.FC<TPaymentMethodChipProps> = ({paymentMethod, ...otherProps}) => {
  const {filters, setFilters} = useFilterStore();

  const handleChipClick = () => {
    if (!filters.paymentMethods) {
      setFilters({
        ...filters,
        paymentMethods: [paymentMethod.ID],
      });
      return;
    }
    setFilters({
      ...filters,
      paymentMethods: [...filters.paymentMethods, paymentMethod.ID],
    });
  };

  const handleChipDelete = () => {
    if (!filters.paymentMethods || !filters.paymentMethods.includes(paymentMethod.ID)) return;
    setFilters({
      ...filters,
      paymentMethods: filters.paymentMethods.filter(id => id !== paymentMethod.ID),
    });
  };

  return (
    <Chip
      onClick={handleChipClick}
      onDelete={
        filters.paymentMethods && filters.paymentMethods.includes(paymentMethod.ID) ? handleChipDelete : undefined
      }
      label={paymentMethod.name}
      variant="outlined"
      {...otherProps}
    />
  );
};
