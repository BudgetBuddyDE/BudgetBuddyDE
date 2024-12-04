import {type TPaymentMethod} from '@budgetbuddyde/types';
import {Chip, type ChipProps} from '@mui/material';
import React from 'react';

import {useFilterStore} from '@/components/Filter';

export type TPaymentMethodChipProps = ChipProps & {paymentMethod: TPaymentMethod};

export const PaymentMethodChip: React.FC<TPaymentMethodChipProps> = ({paymentMethod, ...otherProps}) => {
  const {filters, setFilters} = useFilterStore();

  const handleChipClick = () => {
    if (!filters.paymentMethods) {
      setFilters({
        ...filters,
        paymentMethods: [paymentMethod.id],
      });
      return;
    }
    setFilters({
      ...filters,
      paymentMethods: [...filters.paymentMethods, paymentMethod.id],
    });
  };

  const handleChipDelete = () => {
    if (!filters.paymentMethods || !filters.paymentMethods.includes(paymentMethod.id)) return;
    setFilters({
      ...filters,
      paymentMethods: filters.paymentMethods.filter(id => id !== paymentMethod.id),
    });
  };

  return (
    <Chip
      onClick={handleChipClick}
      onDelete={
        filters.paymentMethods && filters.paymentMethods.includes(paymentMethod.id) ? handleChipDelete : undefined
      }
      label={paymentMethod.name}
      variant="outlined"
      {...otherProps}
    />
  );
};
