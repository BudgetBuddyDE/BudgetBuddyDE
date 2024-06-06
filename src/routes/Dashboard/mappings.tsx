import {DashboardRounded, DonutSmallRounded, TrendingUpRounded} from '@mui/icons-material';

import {Feature} from '@/app.config';
import {isFeatureEnabled} from '@/components/Feature';

import {type TDashboardView} from './index';

const isStocksFeatureEnabled = isFeatureEnabled(Feature.STOCKS);

export const DashboardViewMapping: Record<string, TDashboardView> = {
  ['/dashboard']: 'overview',
  ['/dashboard/budget']: 'budget',
  ...(isStocksFeatureEnabled ? {['/dashboard/stocks']: 'stocks'} : {}),
  ['/dashboard/insights']: 'insights',
};

export const DashboardViewDescriptionMapping: Record<TDashboardView, string | undefined> = {
  ['overview']: 'Overview',
  ['budget']: 'Budget',
  ...(isStocksFeatureEnabled ? {['stocks']: 'Stocks'} : {['stocks']: undefined}),
  ['insights']: 'Insights',
};

export const DashboardViewIconMapping: Record<TDashboardView, React.ReactNode | undefined> = {
  ['overview']: <DashboardRounded />,
  ['budget']: <DonutSmallRounded />,
  ...(isStocksFeatureEnabled ? {['stocks']: <TrendingUpRounded />} : {['stocks']: undefined}),
  ['insights']: <TrendingUpRounded />,
};
