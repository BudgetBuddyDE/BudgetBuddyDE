import {IconCategory, IconDashboard, IconPaperclip, IconRepeat, IconSettings, IconTransfer} from '@tabler/icons-react';

export const navigation = [
  {label: 'Dashboard', href: '/dashboard', matchPath: '/dashboard', icon: IconDashboard},
  {label: 'Transactions', href: '/transactions', matchPath: '/transactions', icon: IconTransfer},
  {label: 'Recurring Payments', href: '/recurringPayments', matchPath: '/recurringPayments', icon: IconRepeat},
  {label: 'Categories', href: '/categories', matchPath: '/categories', icon: IconCategory},
  {label: 'Attachments', href: '/attachments', matchPath: '/attachments', icon: IconPaperclip},
  {label: 'Settings', href: '/settings/profile', matchPath: '/settings', icon: IconSettings},
];
