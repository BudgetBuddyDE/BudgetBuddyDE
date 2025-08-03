import React from 'react';

import { CategoryPieChart, type CategoryPieChartProps } from '.';

export type CategoryIncomeChartProps = Pick<CategoryPieChartProps, 'withViewMore'>;

/**
 * REVISIT: Rework this component
 * Renders a pie chart displaying the income per category.
 *
 * @returns The CategoryExpenseChart component.
 */
export const CategoryIncomeChart: React.FC<CategoryIncomeChartProps> = ({
  withViewMore = false,
}) => {
  return (
    <CategoryPieChart
      title={'Category Income'}
      subtitle={'Income per category'}
      transactionsType={'INCOME'}
      withViewMore={withViewMore}
    />
  );
};
