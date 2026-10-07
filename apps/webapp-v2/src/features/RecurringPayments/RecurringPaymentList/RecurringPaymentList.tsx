'use client';

import {Badge} from '@mantine/core';
import {IconCalendarRepeat} from '@tabler/icons-react';
import type {ReactNode} from 'react';
import type {CardProps} from '@/compositions/Cards/Card';
import {EntityList, ListWithIcon} from '@/compositions/Lists';

export interface RecurringPaymentListItem {
  id: string;
  receiver: string;
  nextExecution: Date;
  transferAmount: number;
  category: {id: string; name: string};
  paymentMethod: {id: string; name: string};
}

export interface RecurringPaymentListProps extends Omit<CardProps, 'children' | 'title'> {
  title?: string;
  subtitle?: string;
  data: RecurringPaymentListItem[];
  isLoading?: boolean;
  noResultsMessage?: string;
  onAddEntity?: () => void;
  headerAction?: ReactNode;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {day: '2-digit', month: '2-digit'});

function formatDate(date: Date) {
  return dateFormatter.format(date).replace(/\.$/, '');
}

function RecurringPaymentRow({payment}: {payment: RecurringPaymentListItem}) {
  return (
    <ListWithIcon
      icon={<IconCalendarRepeat aria-hidden="true" />}
      title={payment.receiver}
      subtitle={
        <>
          <Badge variant="outline">Next {formatDate(payment.nextExecution)}</Badge>
          <Badge variant="outline">{payment.category.name}</Badge>
          <Badge variant="outline">{payment.paymentMethod.name}</Badge>
        </>
      }
      amount={payment.transferAmount}
    />
  );
}

export function RecurringPaymentList({
  title = 'Upcoming recurring payments',
  subtitle = 'Your upcoming recurring payments',
  data,
  isLoading,
  noResultsMessage = 'There are no recurring payments',
  onAddEntity,
  headerAction,
  ...cardProps
}: RecurringPaymentListProps) {
  return (
    <EntityList
      {...cardProps}
      title={title}
      subtitle={subtitle}
      data={data}
      isLoading={isLoading}
      noResultsMessage={noResultsMessage}
      getItemKey={payment => payment.id}
      onAddEntity={onAddEntity}
      headerAction={headerAction}
      renderItem={payment => <RecurringPaymentRow payment={payment} />}
    />
  );
}
