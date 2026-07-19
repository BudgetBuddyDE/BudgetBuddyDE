import {DashboardViewIconMapping} from '@/app/(dashboard)/dashboard/DashboardNavigation';
import {EntityIcon} from '@/lib/ibn';

export const DrawerLinks = [
  {
    text: 'Dashboard',
    path: '/dashboard',
    icon: DashboardViewIconMapping['/dashboard'],
  },
  {
    text: 'Transactions',
    path: '/transactions',
    icon: <EntityIcon entity="transaction" />,
  },
  {
    text: 'Recurring Payments',
    path: '/recurringPayments',
    icon: <EntityIcon entity="recurringPayment" />,
  },
  {
    text: 'Payment Methods',
    path: '/paymentMethods',
    icon: <EntityIcon entity="paymentMethod" />,
  },
  {
    text: 'Categories',
    path: '/categories',
    icon: <EntityIcon entity="category" />,
  },
  {
    text: 'Attachments',
    path: '/attachments',
    icon: <EntityIcon entity="attachment" />,
  },
].filter(Boolean);
