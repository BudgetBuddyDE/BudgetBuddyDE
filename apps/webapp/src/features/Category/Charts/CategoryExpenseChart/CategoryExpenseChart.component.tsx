import React from 'react';

import {CategoryPieChart, type TCategoryPieChartProps} from '../CategoryPieChart';

export type TCategoryExpenseChartProps = Pick<TCategoryPieChartProps, 'withViewMore'>;

/**
 * Renders a pie chart displaying the income per category.
 *
 * @returns The CategoryExpenseChart component.
 */
export const CategoryExpenseChart: React.FC<TCategoryExpenseChartProps> = ({withViewMore = false}) => {
  return (
    <CategoryPieChart
      title={'Category Expenses'}
      subtitle={'Expenses per category'}
      transactionsType={'EXPENSE'}
      withViewMore={withViewMore}
    />
  );
};
