'use client';

import type React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';

import {CategoryPieChart, type CategoryPieChartProps} from './CategoryPieChart';

export type CategoryExpenseChartProps = Pick<CategoryPieChartProps, 'withViewMore'>;

/**
 * REVISIT: Rework this component
 * Renders a pie chart displaying the expenses per category.
 *
 * @returns The CategoryExpenseChart component.
 */
export const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({withViewMore = false}) => {
  const t = useAppTranslations();
  return (
    <CategoryPieChart
      title={t('Category Expenses')}
      subtitle={t('Expenses per category')}
      transactionsType={'EXPENSE'}
      withViewMore={withViewMore}
    />
  );
};
