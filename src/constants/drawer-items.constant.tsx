import DashboardIcon from '@mui/icons-material/Dashboard';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import PaymentsIcon from '@mui/icons-material/Payments';
import LabelIcon from '@mui/icons-material/Label';
import SettingsIcon from '@mui/icons-material/Settings';

export const DrawerLinks = [
  {
    text: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    text: 'Transactions',
    path: '/transactions',
    icon: <CompareArrowsIcon />,
  },
  {
    text: 'Budget',
    path: '/budget',
    icon: <DonutSmallIcon />,
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
  {
    text: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
  },
];
