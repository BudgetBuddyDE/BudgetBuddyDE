'use client';

import {AddRounded, InboxRounded, SearchOffRounded} from '@mui/icons-material';
import {Box, type BoxProps, Button, type ButtonProps, Stack, Typography} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {Card} from '@/components/Card';

export type NoResultsVariant = 'empty' | 'filtered' | 'create';

export type NoResultsProps = Pick<BoxProps, 'sx'> & {
  /** Selects the empty-state copy and visual treatment. */
  variant?: NoResultsVariant;
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

const defaultIcon: Record<NoResultsVariant, React.ReactNode> = {
  empty: <InboxRounded />,
  filtered: <SearchOffRounded />,
  create: <AddRounded />,
};

export const NoResults: React.FC<NoResultsProps> = ({
  variant = 'empty',
  icon,
  title,
  description,
  query,
  action,
  onCreate,
  createLabel,
  text,
  sx,
}) => {
  const t = useTranslations('NoResults');
  const resolvedTitle = title ?? (typeof text === 'string' ? text : undefined) ?? t(`${variant}.title`);
  const resolvedDescription =
    description ?? (typeof text === 'string' || text === undefined ? t(`${variant}.description`) : text);
  const resolvedIcon = icon ?? defaultIcon[variant];
  const isCreateState = variant === 'create';
  const resolvedAction =
    action ??
    (isCreateState && onCreate ? (
      <Button color="inherit" onClick={onCreate} variant="outlined">
        {createLabel ?? t('createAction')}
      </Button>
    ) : null);
  const surfaceSx = [
    isCreateState
      ? {
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          p: 3,
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
          {variant === 'filtered' && query ? t('filtered.queryTitle', {query}) : resolvedTitle}
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

  return (
    <Card component="section" sx={surfaceSx} elevation={1}>
      {content}
    </Card>
  );
};
