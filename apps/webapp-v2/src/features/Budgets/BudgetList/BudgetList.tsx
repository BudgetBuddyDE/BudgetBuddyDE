'use client';

import {Badge, Group, VisuallyHidden} from '@mantine/core';
import {IconThumbUp, IconAlertTriangle} from '@tabler/icons-react';
import {useState} from 'react';
import type {CardProps} from '@/compositions/Cards/Card';
import {EntityList, ListWithIcon} from '@/compositions/Lists';
import {Pagination} from '@/compositions/Pagination';

export interface BudgetListItem {
  id: string;
  name: string;
  type: 'i' | 'e';
  balance: number;
  budget: number;
  categories: {id: string; name: string}[];
}

export interface BudgetListProps {
  data: BudgetListItem[];
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  noResultsMessage?: string;
  slots?: {
    card?: CardProps;
  };
}

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function BudgetRow({budget}: {budget: BudgetListItem}) {
  const isOverBudget = budget.balance > budget.budget;

  return (
    <ListWithIcon
      icon={isOverBudget ? <IconAlertTriangle /> : <IconThumbUp />}
      iconColor={isOverBudget ? 'red' : undefined}
      title={
        <Group gap="xs">
          <span>{budget.name}</span>
          <Badge variant="outline" color="gray" tt="none" fw={400}>
            {budget.type === 'i' ? 'Include' : 'Exclude'}
          </Badge>
          <VisuallyHidden>{isOverBudget ? 'Over budget' : 'Within budget'}</VisuallyHidden>
        </Group>
      }
      subtitle={
        <>
          {budget.categories.map(category => (
            <Badge variant="outline" key={category.id}>
              {category.name}
            </Badge>
          ))}
        </>
      }
      amount={`${currencyFormatter.format(Math.max(0, budget.balance))} / ${currencyFormatter.format(budget.budget)}`}
    />
  );
}

export function BudgetList({
  data,
  title = 'Budgets',
  subtitle = 'Keep on track with your spending',
  isLoading,
  noResultsMessage = 'There are no budgets',
  slots,
}: BudgetListProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(data.length / rowsPerPage) - 1));

  if (page !== currentPage) setPage(currentPage);

  return (
    <EntityList
      {...slots?.card}
      title={title}
      subtitle={subtitle}
      data={data.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)}
      getItemKey={budget => budget.id}
      renderItem={budget => <BudgetRow budget={budget} />}
      isLoading={isLoading}
      noResultsMessage={noResultsMessage}
      footer={
        <Group justify="flex-end" w="100%">
          <Pagination
            count={data.length}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={value => {
              setRowsPerPage(value);
              setPage(0);
            }}
          />
        </Group>
      }
    />
  );
}
