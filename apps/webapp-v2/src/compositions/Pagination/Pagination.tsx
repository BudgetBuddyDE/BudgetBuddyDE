'use client';

import {ActionIcon, Group, NativeSelect, Text} from '@mantine/core';
import {IconChevronLeft, IconChevronRight} from '@tabler/icons-react';
import {useId} from 'react';

export interface PaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

export function Pagination({
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions = [10, 15, 25, 50, 100],
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  const selectId = useId();
  const firstEntry = count === 0 ? 0 : page * rowsPerPage + 1;
  const lastEntry = Math.min((page + 1) * rowsPerPage, count);

  return (
    <Group justify="flex-end" gap="md" wrap="wrap">
      <Group gap="xs" wrap="nowrap">
        <Text component="label" htmlFor={selectId} size="sm">
          Rows:
        </Text>
        <NativeSelect
          id={selectId}
          value={rowsPerPage}
          data={rowsPerPageOptions.map(value => ({value: String(value), label: String(value)}))}
          onChange={event => onRowsPerPageChange(Number(event.currentTarget.value))}
          size="xs"
          w={72}
        />
      </Group>
      <Text size="sm" aria-live="polite">
        {firstEntry}–{lastEntry} of {count}
      </Text>
      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          aria-label="Previous page"
          variant="subtle"
          color="gray"
          disabled={count === 0 || page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <IconChevronLeft size={18} aria-hidden="true" />
        </ActionIcon>
        <ActionIcon
          aria-label="Next page"
          variant="subtle"
          color="gray"
          disabled={lastEntry >= count}
          onClick={() => onPageChange(page + 1)}
        >
          <IconChevronRight size={18} aria-hidden="true" />
        </ActionIcon>
      </Group>
    </Group>
  );
}
