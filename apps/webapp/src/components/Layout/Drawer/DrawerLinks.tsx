import {
  CompareArrowsRounded as CompareArrowsIcon,
  LabelRounded as LabelIcon,
  PaymentsRounded as PaymentsIcon,
  ScheduleSendRounded as ScheduleSendIcon,
} from '@mui/icons-material';

import {Feature} from '@/app.config';
import {isFeatureEnabled} from '@/components/Feature/isFeatureEnabled';
import {DashboardViewIconMapping} from '@/routes/Dashboard';

export const DrawerLinks = [
  {
    text: 'Dashboard',
    path: '/dashboard',
    icon: DashboardViewIconMapping['overview'] as JSX.Element,
  },
  ...(isFeatureEnabled(Feature.STOCKS)
    ? [
        {
          text: 'Stocks',
          path: '/stocks',
          icon: DashboardViewIconMapping['stocks'] as JSX.Element,
        },
      ]
    : []),
  {
    text: 'Transactions',
    path: '/transactions',
    icon: <CompareArrowsIcon />,
  },
  {
    text: 'Subscriptions',
    path: '/subscriptions',
    icon: <ScheduleSendIcon />,
  },
  {
    text: 'Payment Methods',
    path: '/payment-methods',
    icon: <PaymentsIcon />,
  },
  {
    text: 'Categories',
    path: '/categories',
    icon: <LabelIcon />,
  },
].filter(Boolean);
