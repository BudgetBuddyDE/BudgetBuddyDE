'use client';

import {Badge} from '@mantine/core';
import {IconReceipt} from '@tabler/icons-react';
import type {ReactNode} from 'react';
import type {CardProps} from '@/compositions/Cards/Card';
import {EntityList, ListWithIcon} from '@/compositions/Lists';

export interface TransactionListItem {
  id: string;
  receiver: string;
  processedAt: Date;
  transferAmount: number;
  category: {id: string; name: string};
  paymentMethod: {id: string; name: string};
}

export interface TransactionListProps extends Omit<CardProps, 'children' | 'title'> {
  title?: string;
  subtitle?: string;
  data: TransactionListItem[];
  isLoading?: boolean;
  noResultsMessage?: string;
  onAddEntity?: () => void;
  headerAction?: ReactNode;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {day: '2-digit', month: '2-digit'});

function formatDate(date: Date) {
  return dateFormatter.format(date).replace(/\.$/, '');
}

function TransactionRow({transaction}: {transaction: TransactionListItem}) {
  return (
    <ListWithIcon
      icon={<IconReceipt aria-hidden="true" />}
      title={transaction.receiver}
      subtitle={
        <>
          <Badge variant="outline">{formatDate(transaction.processedAt)}</Badge>
          <Badge variant="outline">{transaction.category.name}</Badge>
          <Badge variant="outline">{transaction.paymentMethod.name}</Badge>
        </>
      }
      amount={transaction.transferAmount}
    />
  );
}

export function TransactionList({
  title = 'Transactions',
  subtitle = 'Your latest transactions',
  data,
  isLoading,
  noResultsMessage = "You haven't made any purchases yet",
  onAddEntity,
  headerAction,
  ...cardProps
}: TransactionListProps) {
  return (
    <EntityList
      {...cardProps}
      title={title}
      subtitle={subtitle}
      data={data}
      isLoading={isLoading}
      noResultsMessage={noResultsMessage}
      getItemKey={transaction => transaction.id}
      onAddEntity={onAddEntity}
      headerAction={headerAction}
      renderItem={transaction => <TransactionRow transaction={transaction} />}
    />
  );
}
