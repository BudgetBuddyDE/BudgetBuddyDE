import {DashboardRounded, TrendingUpRounded} from '@mui/icons-material';

import {Feature} from '@/app.config';
import {isFeatureEnabled} from '@/components/Feature/isFeatureEnabled';

import {type TDashboardView} from './index';

const isStocksFeatureEnabled = isFeatureEnabled(Feature.STOCKS);

export const DashboardViewMapping: Record<string, TDashboardView> = {
  ['/dashboard']: 'overview',
  ['/dashboard/analytics']: 'analytics',
  ...(isStocksFeatureEnabled ? {['/dashboard/stocks']: 'stocks'} : {}),
  ['/dashboard/insights']: 'insights',
};

export const DashboardViewDescriptionMapping: Record<TDashboardView, string | undefined> = {
  ['overview']: 'Overview',
  ['analytics']: 'Analytics',
  ...(isStocksFeatureEnabled ? {['stocks']: 'Stocks'} : {['stocks']: undefined}),
  ['insights']: 'Insights',
};

export const DashboardViewIconMapping: Record<TDashboardView, React.ReactNode | undefined> = {
  ['overview']: <DashboardRounded />,
  ['analytics']: <TrendingUpRounded />,
  ...(isStocksFeatureEnabled ? {['stocks']: <TrendingUpRounded />} : {['stocks']: undefined}),
  ['insights']: <TrendingUpRounded />,
};
