import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {type TFullScreenDialogProps} from '@/components/Base/FullScreenDialog';
import {useCategories} from '@/features/Category';
import {InsightsDialog, type TState} from '@/features/Insights';
import {ZSelectDataOption} from '@/features/Insights/InsightsDialog/SelectData';
import {useDocumentTitle} from '@/hooks/useDocumentTitle';

enum QueryKey {
  TYPE = 'type',
  CATEGORY = 'category',
  START_DATE = 'startDate',
  END_DATE = 'endDate',
}

export type TInsightsViewProps =
  | {navigateOnClose: true; navigateTo?: string}
  | ({navigateOnClose: false} & Pick<TFullScreenDialogProps, 'onClose'>);

const InsightsView: React.FC<TInsightsViewProps> = props => {
  useDocumentTitle(`${AppConfig.appName} - Insights`, true);
  const navigate = useNavigate();
  const location = useLocation();
  const {isLoading: isLoadingCategories, data: categories} = useCategories();

  const handleClose = () => {
    if (props.navigateOnClose) {
      props.navigateTo ? navigate(props.navigateTo) : navigate(-1);
    } else props.onClose();
  };

  const parseUrlParams: () => Omit<TState, 'transactions'> = React.useCallback(() => {
    const urlParams = new URLSearchParams(location.search);
    let defaultValues: Omit<TState, 'transactions'> = {
      type: 'INCOME',
      categories: [],
      dateRange: {startDate: new Date(new Date().getFullYear(), 0, 1), endDate: new Date()},
    };
    if (isLoadingCategories) return defaultValues;
    if (urlParams.has(QueryKey.TYPE)) {
      const type = ZSelectDataOption.safeParse(urlParams.get(QueryKey.TYPE));
      if (type.success) defaultValues.type = type.data;
    }

    if (urlParams.has(QueryKey.START_DATE)) {
      const startDate = new Date(urlParams.get(QueryKey.START_DATE)!);
      if (!isNaN(startDate.getTime())) defaultValues.dateRange.startDate = startDate;
    }

    if (urlParams.has(QueryKey.END_DATE)) {
      const endDate = new Date(urlParams.get(QueryKey.END_DATE)!);
      if (!isNaN(endDate.getTime())) defaultValues.dateRange.endDate = endDate;
    }

    if (urlParams.has(QueryKey.CATEGORY) && categories) {
      const categoryIds = urlParams.getAll(QueryKey.CATEGORY);
      // FIXME:
      defaultValues.categories = categoryIds.map(id => ({value: id, label: id}));
    }

    return defaultValues;
  }, [isLoadingCategories, categories]);

  return <InsightsDialog open onClose={handleClose} defaultValues={parseUrlParams()} />;
};

export default InsightsView;
