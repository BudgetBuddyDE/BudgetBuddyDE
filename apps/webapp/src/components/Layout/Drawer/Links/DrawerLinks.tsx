import {
  LabelRounded as LabelIcon,
  PaymentsRounded as PaymentsIcon,
  ReceiptRounded,
  ScheduleSendRounded as ScheduleSendIcon,
} from '@mui/icons-material';
import {DashboardViewIconMapping} from '@/app/(dashboard)/dashboard/DashboardNavigation';

export const DrawerLinks = [
  {
    text: 'Dashboard',
    path: '/dashboard',
    icon: DashboardViewIconMapping['/dashboard'],
  },
  {
    text: 'Transactions',
    path: '/transactions',
    icon: <ReceiptRounded />,
  },
  {
    text: 'Recurring Payments',
    path: '/recurringPayments',
    icon: <ScheduleSendIcon />,
  },
  {
    text: 'Payment Methods',
    path: '/paymentMethods',
    icon: <PaymentsIcon />,
  },
  {
    text: 'Categories',
    path: '/categories',
    icon: <LabelIcon />,
  },
].filter(Boolean);
