'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import {ThumbUpAltRounded, WarningRounded} from '@mui/icons-material';
import {Box, Chip, Stack, Typography} from '@mui/material';
import type React from 'react';
import {Icon} from '@/components/Icon';
import {EntityMenu} from '@/components/Table/EntityMenu';
import {HideHorizontalScrollbarStyle} from '@/theme/style';
import {Formatter} from '@/utils/Formatter';

export type Budget = {
  ID: string;
  type: 'i' | 'e'; // 'i' for income, 'e' for expense
  name: string;
  categories: TCategoryVH[];
  budget: number;
  balance: number;
  description?: string;
};

export type BudgetItemProps = {
  budget: Budget;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budget: Budget) => void;
  onClickBudget?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, budget: Budget) => void;
};

export const BudgetItem: React.FC<BudgetItemProps> = ({budget, onEditBudget, onDeleteBudget, onClickBudget}) => {
  const isOverBudget: boolean = (budget.balance ?? 0) > budget.budget;

  return (
    <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'space-between'}>
      <Stack
        sx={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          mr: 2,
          overflowX: 'scroll',
          ':hover': onClickBudget
            ? {
                borderRadius: theme => `${theme.shape.borderRadius}px`,
                backgroundColor: theme => theme.palette.action.hover,
                cursor: 'pointer',
              }
            : undefined,
          ...HideHorizontalScrollbarStyle,
        }}
        {...(onClickBudget && {
          onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => onClickBudget(e, budget),
        })}
      >
        <Icon
          icon={isOverBudget ? <WarningRounded /> : <ThumbUpAltRounded />}
          iconcolor={isOverBudget ? 'error' : 'primary'}
          sx={{mr: 1}}
        />
        <Box sx={{mr: 1}}>
          <Stack flexDirection={'row'} gap={1}>
            <Typography variant="body1" fontWeight="bolder">
              {budget.name}
            </Typography>
            <Chip label={budget.type === 'i' ? 'Include' : 'Exclude'} variant="outlined" />
          </Stack>
          <Stack flexDirection={'row'} columnGap={1}>
            {budget.categories.map(({id, name}) => (
              <Chip key={id} label={name} variant="outlined" />
            ))}
          </Stack>
        </Box>
        <Box
          sx={{
            ml: 'auto',
            textAlign: 'right',
            flexDirection: {xs: 'column', md: 'row'},
            alignItems: 'baseline',
            columnGap: 0.5,
          }}
        >
          <Typography fontWeight="bold">
            {Formatter.currency.formatBalance(budget.balance <= 0 ? 0 : budget.balance)} /{' '}
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
