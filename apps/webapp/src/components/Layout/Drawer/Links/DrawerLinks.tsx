import {DashboardViewIconMapping} from '@/app/(dashboard)/dashboard/DashboardNavigation';
import type {useAppTranslations} from '@/hooks/useAppTranslations';
import {EntityIcon} from '@/lib/ibn';

export const getDrawerLinks = (t: ReturnType<typeof useAppTranslations>) =>
  [
    {
      text: t('Dashboard'),
      path: '/dashboard',
      icon: DashboardViewIconMapping['/dashboard'],
    },
    {
      text: t('Transactions'),
      path: '/transactions',
      icon: <EntityIcon entity="transaction" />,
    },
    {
      text: t('Recurring Payments'),
      path: '/recurringPayments',
      icon: <EntityIcon entity="recurringPayment" />,
    },
    {
      text: t('Payment Methods'),
      path: '/paymentMethods',
      icon: <EntityIcon entity="paymentMethod" />,
    },
    {
      text: t('Categories'),
      path: '/categories',
      icon: <EntityIcon entity="category" />,
    },
    {
      text: t('Attachments'),
      path: '/attachments',
      icon: <EntityIcon entity="attachment" />,
    },
  ].filter(Boolean);
