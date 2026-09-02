import type React from 'react';

import {CategoryPieChart, type CategoryPieChartProps} from '../CategoryPieChart';

export type CategoryExpenseChartProps = Pick<CategoryPieChartProps, 'withViewMore' | 'initialData'>;

/**
 * REVISIT: Rework this component
 * Renders a pie chart displaying the income per category.
 *
 * @returns The CategoryExpenseChart component.
 */
export const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({withViewMore = false, initialData}) => {
  return (
    <CategoryPieChart
      title={'Category Expenses'}
      subtitle={'Expenses per category'}
      transactionsType={'EXPENSE'}
      withViewMore={withViewMore}
      initialData={initialData}
    />
  );
};
