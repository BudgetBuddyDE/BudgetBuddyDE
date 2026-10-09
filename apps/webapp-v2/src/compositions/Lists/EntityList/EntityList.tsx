'use client';

import {ActionIcon, Box, Loader, Stack, Text} from '@mantine/core';
import type {CardProps, PolymorphicComponentProps} from '@mantine/core';
import {IconPlus} from '@tabler/icons-react';
import type {ElementType, Key, ReactNode} from 'react';
import {Card} from '@/compositions/Cards/Card';

export interface EntityListProps<T> extends Omit<CardProps, 'children'> {
  title: string;
  subtitle?: ReactNode;
  data: T[];
  renderItem: (item: T) => ReactNode;
  getItemKey?: (item: T, index: number) => Key;
  isLoading?: boolean;
  noResultsMessage?: ReactNode;
  onAddEntity?: () => void;
  headerAction?: ReactNode;
  footer?: ReactNode;
}

type EntityListPolymorphicProps<T, C extends ElementType> = EntityListProps<T> &
  PolymorphicComponentProps<C, Omit<CardProps, 'children'>>;

export function EntityList<T, C extends ElementType = 'section'>({
  title,
  subtitle,
  data,
  renderItem,
  getItemKey,
  isLoading = false,
  noResultsMessage = 'No results found',
  onAddEntity,
  headerAction,
  footer,
  component,
  ...cardProps
}: EntityListPolymorphicProps<T, C>) {
  const action =
    headerAction !== undefined ? (
      headerAction
    ) : onAddEntity ? (
      <ActionIcon aria-label={`Add ${title}`} onClick={onAddEntity} variant="light">
        <IconPlus size={20} aria-hidden="true" />
      </ActionIcon>
    ) : null;

  return (
    <Card {...(cardProps as CardProps)} component={(component ?? 'section') as 'section'}>
      <Card.Header>
        <Box>
          <Card.Title order={2}>{title}</Card.Title>
          {subtitle != null && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>
        {action ? <Card.HeaderActions>{action}</Card.HeaderActions> : null}
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <Box py="md" ta="center" aria-label="Loading">
            <Loader />
          </Box>
        ) : data.length === 0 ? (
          <Text c="dimmed">{noResultsMessage}</Text>
        ) : (
          <Stack gap="md">
            {data.map((item, index) => (
              <Box key={getItemKey?.(item, index) ?? index}>{renderItem(item)}</Box>
            ))}
          </Stack>
        )}
      </Card.Body>
      {footer != null && <Card.Footer>{footer}</Card.Footer>}
    </Card>
  );
}
