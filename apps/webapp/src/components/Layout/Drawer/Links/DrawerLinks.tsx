import {DashboardViewIconMapping} from '@/app/(dashboard)/dashboard/DashboardNavigation';
import type {useAppTranslations} from '@/hooks/useAppTranslations';
import {EntityIcon} from '@/lib/ibn';

export const getDrawerLinks = (t: ReturnType<typeof useAppTranslations>) =>
  [
    {
      text: t('forms.dashboard'),
      path: '/dashboard',
      icon: DashboardViewIconMapping['/dashboard'],
    },
    {
      text: t('forms.transactions'),
      path: '/transactions',
      icon: <EntityIcon entity="transaction" />,
    },
    {
      text: t('forms.recurringPayments'),
      path: '/recurringPayments',
      icon: <EntityIcon entity="recurringPayment" />,
    },
    {
      text: t('forms.paymentMethods'),
      path: '/paymentMethods',
      icon: <EntityIcon entity="paymentMethod" />,
    },
    {
      text: t('forms.categories'),
      path: '/categories',
      icon: <EntityIcon entity="category" />,
    },
    {
      text: t('forms.attachments'),
      path: '/attachments',
      icon: <EntityIcon entity="attachment" />,
    },
  ].filter(Boolean);
