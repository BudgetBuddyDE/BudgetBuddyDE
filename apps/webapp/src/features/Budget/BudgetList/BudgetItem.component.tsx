import {type TExpandedBudgetProgress} from '@budgetbuddyde/types';
import {DeleteRounded, EditRounded, ThumbUpAltRounded, WarningRounded} from '@mui/icons-material';
import {Box, Chip, IconButton, Stack, Typography} from '@mui/material';
import React from 'react';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {Icon} from '@/components/Icon';
import {Formatter} from '@/services/Formatter';
import {HideHorizontalScrollbarStyle} from '@/style/HideHorizontalScrollbar.style';

import {type TBudgetListProps} from './BudgetList.component';

export type TBudgetItemProps = {
  budget: TExpandedBudgetProgress;
} & Pick<TBudgetListProps, 'onEditBudget' | 'onDeleteBudget' | 'onClickBudget'>;

export const BudgetItem: React.FC<TBudgetItemProps> = ({budget, onEditBudget, onDeleteBudget, onClickBudget}) => {
  const isOverBudget = budget.progress > budget.budget;

  return (
    <Stack
      flexDirection={'row'}
      alignItems={'center'}
      justifyContent={'space-between'}
      {...(onClickBudget && {
        sx: {
          ':hover': {
            borderRadius: theme => theme.shape.borderRadius + 'px',
            backgroundColor: theme => theme.palette.action.hover,
            cursor: 'pointer',
          },
        },
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => onClickBudget(e, budget),
      })}>
      <Stack
        sx={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          mr: 2,
          overflowX: 'scroll',
          ...HideHorizontalScrollbarStyle,
        }}>
        <Icon
          icon={isOverBudget ? <WarningRounded /> : <ThumbUpAltRounded />}
          iconColor={isOverBudget ? 'error' : 'primary'}
          sx={{mr: 1}}
        />
        <Box sx={{mr: 1}}>
          <Typography variant="body1" fontWeight="bolder">
            {budget.label}
          </Typography>
          <Stack flexDirection={'row'} columnGap={1}>
            {budget.expand.categories.map(({id, name}) => (
              <Chip key={id} label={name} variant="outlined" />
            ))}
          </Stack>
        </Box>
        <Box
          sx={{
            ml: 'auto',
            display: {xs: 'none', md: 'flex'},
            flexDirection: {xs: 'column', md: 'row'},
            alignItems: 'baseline',
            columnGap: 0.5,
          }}>
          <Typography fontWeight="bold">
            {Formatter.formatBalance(budget.progress > 0 ? budget.progress : 0)} /{' '}
            {Formatter.formatBalance(budget.budget)}
          </Typography>
        </Box>
      </Stack>
      <ActionPaper>
        <IconButton onClick={() => onEditBudget(budget)}>
          <EditRounded color="primary" />
        </IconButton>
        <IconButton onClick={() => onDeleteBudget(budget)}>
          <DeleteRounded color="primary" />
        </IconButton>
      </ActionPaper>
    </Stack>
  );
};
