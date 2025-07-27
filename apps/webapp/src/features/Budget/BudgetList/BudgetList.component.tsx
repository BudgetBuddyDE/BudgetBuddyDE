import {AddRounded} from '@mui/icons-material';
import {Box, IconButton, Stack} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {Error as ErrorComp} from '@/components/Error';
import {NoResults} from '@/components/NoResults';
import {type TExpandedBudget} from '@/newTypes';

import {useBudgets} from '../useBudgets.hook';
import {BudgetItem} from './BudgetItem.component';

export type TBudgetListProps = {
  onAddBudget: () => void;
  onEditBudget: (budget: TExpandedBudget) => void;
  onDeleteBudget: (budget: TExpandedBudget) => void;
  onClickBudget?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, budget: TExpandedBudget) => void;
};

export const BudgetList: React.FC<TBudgetListProps> = ({onAddBudget, onEditBudget, onDeleteBudget, onClickBudget}) => {
  const {isLoading, data, error} = useBudgets();
  return (
    <Card>
      <Card.Header sx={{mb: 1}}>
        <Box>
          <Card.Title>Budget</Card.Title>
          <Card.Subtitle>Keep your spendings on track</Card.Subtitle>
        </Box>

        <Card.HeaderActions>
          <IconButton color="primary" onClick={onAddBudget}>
            <AddRounded />
          </IconButton>
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        <ErrorComp error={error} sx={{my: 1, mb: data && data?.length > 0 ? 1 : 0}} />
        {isLoading ? (
          'Loading...'
        ) : data && data.length > 0 ? (
          <Stack rowGap={1}>
            {data.map(budget => (
              <BudgetItem
                key={budget.ID}
                budget={budget}
                onEditBudget={onEditBudget}
                onDeleteBudget={onDeleteBudget}
                onClickBudget={onClickBudget}
              />
            ))}
          </Stack>
        ) : (
          <NoResults text={"You haven't created any budgets yet! Create one..."} />
        )}
      </Card.Body>
    </Card>
  );
};
