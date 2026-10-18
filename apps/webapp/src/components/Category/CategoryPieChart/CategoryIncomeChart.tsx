'use client';

import type React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';

import {CategoryPieChart, type CategoryPieChartProps} from './CategoryPieChart';

export type CategoryIncomeChartProps = Pick<CategoryPieChartProps, 'withViewMore'>;

/**
 * REVISIT: Rework this component
 * Renders a pie chart displaying the income per category.
 *
 * @returns The CategoryExpenseChart component.
 */
export const CategoryIncomeChart: React.FC<CategoryIncomeChartProps> = ({withViewMore = false}) => {
  const t = useAppTranslations();
  return (
    <CategoryPieChart
      title={t('categories.categoryIncome')}
      subtitle={t('categories.incomePerCategory')}
      transactionsType={'INCOME'}
      withViewMore={withViewMore}
    />
  );
};
