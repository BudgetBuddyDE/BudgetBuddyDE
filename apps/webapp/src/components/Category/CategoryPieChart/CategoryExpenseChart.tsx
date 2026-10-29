import {useTranslations} from 'next-intl';
import type React from 'react';

import {CategoryPieChart, type CategoryPieChartProps} from './CategoryPieChart';

export type CategoryExpenseChartProps = Pick<CategoryPieChartProps, 'withViewMore'>;

/**
 * REVISIT: Rework this component
 * Renders a pie chart displaying the expenses per category.
 *
 * @returns The CategoryExpenseChart component.
 */
export const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({withViewMore = false}) => {
  const t = useTranslations('CategoryPieChart');

  return (
    <CategoryPieChart
      title={t('categoryExpensesTitle')}
      subtitle={t('expensesPerCategory')}
      transactionsType={'EXPENSE'}
      withViewMore={withViewMore}
    />
  );
};
