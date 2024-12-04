import React from 'react';

import {CategoryPieChart, type TCategoryPieChartProps} from '../CategoryPieChart';

export type TCategoryIncomeChartProps = Pick<TCategoryPieChartProps, 'withViewMore'>;

/**
 * Renders a pie chart displaying the income per category.
 *
 * @returns The CategoryIncomeChart component.
 */
export const CategoryIncomeChart: React.FC<TCategoryIncomeChartProps> = ({withViewMore = false}) => {
  return (
    <CategoryPieChart
      title={'Category Income'}
      subtitle={'Income per category'}
      transactionsType={'INCOME'}
      withViewMore={withViewMore}
    />
  );
};
