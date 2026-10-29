import {useTranslations} from 'next-intl';
import type React from 'react';

import {CategoryPieChart, type CategoryPieChartProps} from './CategoryPieChart';

export type CategoryIncomeChartProps = Pick<CategoryPieChartProps, 'withViewMore'>;

/**
 * REVISIT: Rework this component
 * Renders a pie chart displaying the income per category.
 *
 * @returns The CategoryExpenseChart component.
 */
export const CategoryIncomeChart: React.FC<CategoryIncomeChartProps> = ({withViewMore = false}) => {
  const t = useTranslations('CategoryPieChart');

  return (
    <CategoryPieChart
      title={t('categoryIncomeTitle')}
      subtitle={t('incomePerCategory')}
      transactionsType={'INCOME'}
      withViewMore={withViewMore}
    />
  );
};
