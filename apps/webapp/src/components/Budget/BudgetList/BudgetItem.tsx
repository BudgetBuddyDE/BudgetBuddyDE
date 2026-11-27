'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import ThumbUpAltRounded from '@mui/icons-material/ThumbUpAltRounded';
import WarningRounded from '@mui/icons-material/WarningRounded';
import {Box, Button, Chip, Stack, Typography} from '@mui/material';
import {useTranslations} from 'next-intl';
import type React from 'react';
import {Icon} from '@/components/Icon';
import {EntityMenu} from '@/components/Table/EntityMenu';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';

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
  onClickBudget?: (budget: Budget) => void;
};

export const BudgetItem: React.FC<BudgetItemProps> = ({budget, onEditBudget, onDeleteBudget, onClickBudget}) => {
  const t = useTranslations('BudgetList');
  const currency = useCurrencyPreference();
  const isOverBudget: boolean = (budget.balance ?? 0) > budget.budget;

  return (
    <Stack
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Stack
        sx={{
          flex: 1,
          minWidth: 0,
          flexDirection: {xs: 'column', sm: 'row'},
          alignItems: {xs: 'stretch', sm: 'center'},
          gap: 1,
          mr: 1,
        }}
      >
        <Icon
          icon={isOverBudget ? <WarningRounded /> : <ThumbUpAltRounded />}
          iconcolor={isOverBudget ? 'error' : 'primary'}
          sx={{mr: 1}}
        />
        <Box sx={{mr: 1}}>
          <Stack direction="row" sx={{gap: 1, flexWrap: 'wrap', alignItems: 'center'}}>
            {onClickBudget ? (
              <Button
                aria-label={`View transactions for ${budget.name}`}
                onClick={() => onClickBudget(budget)}
                sx={{p: 0, minWidth: 0, textTransform: 'none', textAlign: 'left', overflowWrap: 'anywhere'}}
              >
                {budget.name}
              </Button>
            ) : (
              <Typography sx={{fontWeight: 'bold', overflowWrap: 'anywhere'}}>{budget.name}</Typography>
            )}
            <Chip label={budget.type === 'i' ? t('include') : t('exclude')} variant="outlined" />
          </Stack>
          <Stack
            sx={{
              flexDirection: 'row',
              gap: 0.5,
              flexWrap: 'wrap',
            }}
          >
            {budget.categories.map(({id, name}) => (
              <Chip key={id} label={name} variant="outlined" sx={{maxWidth: '100%'}} />
            ))}
          </Stack>
        </Box>
        <Box
          sx={{
            ml: {sm: 'auto'},
            textAlign: {xs: 'left', sm: 'right'},
            overflowWrap: 'anywhere',
            flexDirection: {xs: 'column', md: 'row'},
            alignItems: 'baseline',
            columnGap: 0.5,
          }}
        >
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
          >
            {Formatter.currency.formatBalance(budget.balance <= 0 ? 0 : budget.balance, currency)} /{' '}
            {Formatter.currency.formatBalance(budget.budget, currency)}
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
