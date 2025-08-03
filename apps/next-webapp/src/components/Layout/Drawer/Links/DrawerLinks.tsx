import { DashboardViewIconMapping } from '@/app/(dashboard)/dashboard/DashboardNavigation';
import {
  CompareArrowsRounded as CompareArrowsIcon,
  LabelRounded as LabelIcon,
  PaymentsRounded as PaymentsIcon,
  ScheduleSendRounded as ScheduleSendIcon,
} from '@mui/icons-material';

export const DrawerLinks = [
  {
    text: 'Dashboard',
    path: '/dashboard',
    icon: DashboardViewIconMapping['/dashboard'],
  },
  {
    text: 'Stocks',
    path: '/stocks',
    icon: DashboardViewIconMapping['/dashboard/stocks'],
  },
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
