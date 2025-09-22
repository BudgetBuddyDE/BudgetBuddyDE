'use client';

import { ThumbUpAltRounded, WarningRounded } from '@mui/icons-material';
import { Box, Chip, Stack, Typography } from '@mui/material';
import React from 'react';

import { Icon } from '@/components/Icon';
import { HideHorizontalScrollbarStyle } from '@/style';
import { Formatter } from '@/utils/Formatter';
import { Budget, type TCategory_VH } from '@/types';
import { EntityMenu } from '@/components/Table/EntityTable';

export type Budget = {
  ID: string;
  type: 'i' | 'e'; // 'i' for income, 'e' for expense
  name: string;
  categories: TCategory_VH[];
  budget: number;
  balance?: number;
};

export type BudgetItemProps = {
  budget: Budget;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budget: Budget) => void;
  onClickBudget?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, budget: Budget) => void;
};

export const BudgetItem: React.FC<BudgetItemProps> = ({
  budget,
  onEditBudget,
  onDeleteBudget,
  onClickBudget,
}) => {
  const isOverBudget: boolean = (budget.balance ?? 0) > budget.budget;

  return (
    <Stack
      flexDirection={'row'}
      alignItems={'center'}
      justifyContent={'space-between'}
      {...(onClickBudget && {
        sx: {
          ':hover': {
            borderRadius: (theme) => theme.shape.borderRadius + 'px',
            backgroundColor: (theme) => theme.palette.action.hover,
            cursor: 'pointer',
          },
        },
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => onClickBudget(e, budget),
      })}
    >
      <Stack
        sx={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          mr: 2,
          overflowX: 'scroll',
          ...HideHorizontalScrollbarStyle,
        }}
      >
        <Icon
          icon={isOverBudget ? <WarningRounded /> : <ThumbUpAltRounded />}
          iconColor={isOverBudget ? 'error' : 'primary'}
          sx={{ mr: 1 }}
        />
        <Box sx={{ mr: 1 }}>
          <Stack flexDirection={'row'} gap={1}>
            <Typography variant="body1" fontWeight="bolder">
              {budget.name}{' '}
            </Typography>
            <Chip label={budget.type == 'i' ? 'Include' : 'Exclude'} variant="outlined" />
          </Stack>
          <Stack flexDirection={'row'} columnGap={1}>
            {budget.categories.map(({ ID, name }) => (
              <Chip key={ID} label={name} variant="outlined" />
            ))}
          </Stack>
        </Box>
        <Box
          sx={{
            ml: 'auto',
            textAlign: 'right',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'baseline',
            columnGap: 0.5,
          }}
        >
          <Typography fontWeight="bold">
            {Formatter.currency.formatBalance(budget.balance ?? 0)} /{' '}
            {Formatter.currency.formatBalance(budget.budget)}
          </Typography>
        </Box>
      </Stack>

      <EntityMenu<Budget>
        entity={budget}
        handleEditEntity={() => onEditBudget(budget)}
        handleDeleteEntity={() => onDeleteBudget(budget)}
      />
    </Stack>
  );
};
