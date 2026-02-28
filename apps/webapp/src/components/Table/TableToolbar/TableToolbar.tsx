'use client';

import {
  Box,
  IconButton,
  type IconButtonProps,
  Skeleton,
  type SxProps,
  type Theme,
  Tooltip,
  Typography,
} from '@mui/material';
import type React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {SearchInput} from '@/components/Form/SearchInput';

type BaseToolbarActionArgs = {
  id: string;
};

export type ToolbarAction =
  | ({type?: 'button'} & BaseToolbarActionArgs & {
        label: string;
        disabled?: boolean;
        icon: React.ReactNode;
        onClick: () => void;
        color?: IconButtonProps['color'];
      })
  | ({type: 'custom'} & BaseToolbarActionArgs & {component: React.ReactNode});

export type TableToolbarProps = {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchDebounceMs?: number;
  actions?: ToolbarAction[];
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
};

export const TableToolbar: React.FC<TableToolbarProps & {isLoading?: boolean}> = ({
  title,
  subtitle,
  showSearch = false,
  searchPlaceholder = 'Search…',
  onSearch,
  searchDebounceMs = 500,
  actions = [],
  children,
  isLoading = false,
  sx,
}) => {
  const hasTitle = title && title.length > 0;
  const hasSubtitle = subtitle && subtitle.length > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        mb: 1,
        px: 2,
        pt: 2,
        ...sx,
      }}
    >
      {(hasTitle || hasSubtitle) && (
        <Box>
          {hasTitle && (
            <Typography variant="subtitle1" fontWeight="bold">
              {title}
            </Typography>
          )}
          {hasSubtitle && (
            <Typography variant="subtitle2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          ml: 'auto',
        }}
      >
        {isLoading ? (
          <Skeleton variant="rounded" sx={{width: {xs: '5rem', md: '10rem'}, height: '2.3rem'}} />
        ) : (
          <ActionPaper sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
            {showSearch && onSearch && (
              <SearchInput
                placeholder={searchPlaceholder}
                onSearch={onSearch}
                debounceWaitInMilliseconds={searchDebounceMs}
              />
            )}
            {actions.map((action: ToolbarAction) => {
              if (!action.type || action.type === 'button') {
                return (
                  <Tooltip key={action.id} title={action.label} placement="bottom">
                    <IconButton
                      color={action.color ?? 'primary'}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      aria-label={action.label}
                    >
                      {action.icon}
                    </IconButton>
                  </Tooltip>
                );
              } else if (action.type === 'custom') {
                return action.component;
              }

              return null;
            })}
            {children}
          </ActionPaper>
        )}
      </Box>
    </Box>
  );
};
