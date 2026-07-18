import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import LabelIcon from '@mui/icons-material/LabelRounded';
import PaymentsIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptRounded from '@mui/icons-material/ReceiptRounded';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSendRounded';
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
  {
    text: 'Attachments',
    path: '/attachments',
    icon: <AttachFileRounded />,
  },
].filter(Boolean);
