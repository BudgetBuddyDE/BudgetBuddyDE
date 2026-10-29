import {DashboardViewIconMapping} from '@/app/(dashboard)/dashboard/DashboardNavigation';
import {EntityIcon} from '@/lib/ibn';

export const DrawerLinks = [
  {
    text: 'dashboard',
    path: '/dashboard',
    icon: DashboardViewIconMapping['/dashboard'],
  },
  {
    text: 'transactions',
    path: '/transactions',
    icon: <EntityIcon entity="transaction" />,
  },
  {
    text: 'recurringPayments',
    path: '/recurringPayments',
    icon: <EntityIcon entity="recurringPayment" />,
  },
  {
    text: 'paymentMethods',
    path: '/paymentMethods',
    icon: <EntityIcon entity="paymentMethod" />,
  },
  {
    text: 'categories',
    path: '/categories',
    icon: <EntityIcon entity="category" />,
  },
  {
    text: 'attachments',
    path: '/attachments',
    icon: <EntityIcon entity="attachment" />,
  },
].filter(Boolean);
