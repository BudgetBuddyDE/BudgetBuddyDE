'use client';

import AddRounded from '@mui/icons-material/AddRounded';
import InboxRounded from '@mui/icons-material/InboxRounded';
import SearchOffRounded from '@mui/icons-material/SearchOffRounded';
import {Box, type BoxProps, Button, type ButtonProps, Paper, Stack, Typography} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';

export type NoResultsVariant = 'empty' | 'filtered' | 'create';
export type NoResultsSurface = 'card' | 'paper' | 'none';

export type NoResultsProps = Pick<BoxProps, 'sx'> & {
  /** Selects the empty-state copy and visual treatment. */
  variant?: NoResultsVariant;
  /** Visual surface used to distinguish the empty state from its surroundings. */
  surface?: NoResultsSurface;
  /** Optional icon shown above the empty-state copy. */
  icon?: React.ReactNode;
  /** Primary empty-state message. */
  title?: React.ReactNode;
  /** Supporting text below the title. */
  description?: React.ReactNode;
  /** Search term or filter value used by the `filtered` variant. */
  query?: string;
  /** Optional MUI action, such as a create or refresh button. */
  action?: React.ReactNode;
  /** Creates the default button for the `create` variant. */
  onCreate?: ButtonProps['onClick'];
  /** Label for the default create button. */
  createLabel?: React.ReactNode;
  /** @deprecated Use `title` or `description` instead. */
  text?: string | React.ReactNode;
};

const defaultTitle: Record<NoResultsVariant, string> = {
  empty: 'Nothing to show yet',
  filtered: 'No matching results',
  create: 'Create your first item',
};

const defaultDescription: Partial<Record<NoResultsVariant, string>> = {
  empty: 'Items will appear here as soon as they are available.',
  filtered: 'Try a different search term or clear one of your filters.',
  create: 'Add your first item to get started and keep everything organized.',
};

const defaultIcon: Record<NoResultsVariant, React.ReactNode> = {
  empty: <InboxRounded />,
  filtered: <SearchOffRounded />,
  create: <AddRounded />,
};

export const NoResults: React.FC<NoResultsProps> = ({
  variant = 'empty',
  surface = 'card',
  icon,
  title,
  description,
  query,
  action,
  onCreate,
  createLabel = 'Create item',
  text,
  sx,
}) => {
  const resolvedTitle = title ?? (typeof text === 'string' ? text : undefined) ?? defaultTitle[variant];
  const resolvedDescription =
    description ?? (typeof text === 'string' || text === undefined ? defaultDescription[variant] : text);
  const resolvedIcon = icon ?? defaultIcon[variant];
  const isCreateState = variant === 'create';
  const resolvedAction =
    action ??
    (isCreateState && onCreate ? (
      <Button color="inherit" onClick={onCreate} variant="outlined">
        {createLabel}
      </Button>
    ) : null);
  const surfaceSx = [
    isCreateState
      ? {
          alignItems: 'center',
          borderColor: 'divider',
          borderStyle: 'dashed',
          display: 'flex',
          justifyContent: 'center',
          minHeight: {xs: 260, sm: 300},
          p: {xs: 3, sm: 4},
        }
      : {p: {xs: 2.5, sm: 3}},
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  const content = (
    <Stack spacing={2} sx={{alignItems: 'center', textAlign: 'center'}}>
      <Box
        aria-hidden
        sx={{
          alignItems: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 1.5,
          color: 'text.primary',
          display: 'flex',
          height: 44,
          justifyContent: 'center',
          width: 44,
          '& .MuiSvgIcon-root': {fontSize: 22},
        }}
      >
        {resolvedIcon}
      </Box>
      <Stack spacing={0.5} sx={{alignItems: 'center'}}>
        <Typography component="h2" variant="subtitle2" sx={{fontWeight: 600, letterSpacing: '-0.01em'}}>
          {variant === 'filtered' && query ? `No results for "${query}"` : resolvedTitle}
        </Typography>
        {resolvedDescription && (
          <Typography color="text.secondary" sx={{lineHeight: 1.6, maxWidth: 400}} variant="body2">
            {resolvedDescription}
          </Typography>
        )}
      </Stack>
      {resolvedAction}
    </Stack>
  );

  if (surface === 'none') {
    return (
      <Box component="section" sx={surfaceSx}>
        {content}
      </Box>
    );
  }

  if (surface === 'paper') {
    return (
      <Paper component="section" variant="outlined" sx={surfaceSx}>
        {content}
      </Paper>
    );
  }

  return (
    <Card component="section" variant="outlined" sx={surfaceSx}>
      {content}
    </Card>
  );
};
