import type {TPaymentMethod} from '@budgetbuddyde/types';
import {Chip, type ChipProps, Tooltip} from '@mui/material';
import React from 'react';

import {useFilterStore} from '@/components/Filter';
import {useTransactionStore} from '@/components/Transaction';

export type TPaymentMethodChipProps = ChipProps & {paymentMethod: TPaymentMethod; showUsage?: boolean};

export const PaymentMethodChip: React.FC<TPaymentMethodChipProps> = ({
  paymentMethod,
  showUsage = false,
  ...otherProps
}) => {
  const {filters, setFilters} = useFilterStore();
  const {paymentMethodUsage} = useTransactionStore();

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

  if (showUsage) {
    return (
      <Tooltip
        title={`Used ${paymentMethodUsage.has(paymentMethod.id) ? paymentMethodUsage.get(paymentMethod.id) : 0} times`}
        placement="top"
        arrow>
        <Chip
          onClick={handleChipClick}
          onDelete={
            filters.paymentMethods && filters.paymentMethods.includes(paymentMethod.id) ? handleChipDelete : undefined
          }
          label={paymentMethod.name}
          variant="outlined"
          {...otherProps}
        />
      </Tooltip>
    );
  }
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
