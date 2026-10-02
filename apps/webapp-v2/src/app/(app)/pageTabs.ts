import type {PageHeaderTab} from '@/compositions/PageHeader/PageHeader';

export const transactionTabs: readonly PageHeaderTab[] = [
  {label: 'Overview', href: '/transactions'},
  {label: 'Attachments', href: '/transactions/attachments'},
];

export const settingsTabs: readonly PageHeaderTab[] = [
  {label: 'Profile', href: '/settings/profile'},
  {label: 'API Keys', href: '/settings/apiKeys'},
];
