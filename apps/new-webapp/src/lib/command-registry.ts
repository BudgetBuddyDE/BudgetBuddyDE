export interface CommandContext {
  pathname: string;
}
export interface CommandDefinition {
  id: string;
  label: string;
  group: 'Navigate' | 'Create' | 'Edit' | 'Search' | 'Report' | 'Settings' | 'Account';
  keywords: string[];
  href: string | ((input: string) => string);
  available?: (context: CommandContext) => boolean;
}
export interface ResolvedCommand {
  command: CommandDefinition;
  href: string;
}

const navigationCommands = [
  ['dashboard', 'Open dashboard', '/dashboard'],
  ['transactions', 'Open transactions', '/transactions'],
  ['categories', 'Open categories', '/categories'],
  ['payment-methods', 'Open payment methods', '/payment-methods'],
  ['recurring', 'Open recurring payments', '/recurring-payments'],
  ['budgets', 'Open budgets', '/budgets'],
  ['analytics', 'Open analytics', '/analytics'],
  ['reports', 'Open reports', '/reports'],
  ['attachments', 'Open attachments', '/attachments'],
  ['import-export', 'Open import and export', '/import-export'],
  ['settings', 'Open profile settings', '/settings/profile'],
] as const;

export const commandRegistry: CommandDefinition[] = [
  ...navigationCommands.map(([id, label, href]) => ({
    id: `navigate-${id}`,
    label,
    href,
    group: 'Navigate' as const,
    keywords: [id, label],
    available: ({pathname}: CommandContext) => pathname !== href,
  })),
  {
    id: 'create-transaction',
    label: 'Create transaction',
    group: 'Create',
    keywords: ['new expense', 'new income', 'record money'],
    href: '/transactions?intent=create',
  },
  {
    id: 'create-category',
    label: 'Create category',
    group: 'Create',
    keywords: ['new category'],
    href: '/categories?intent=create',
  },
  {
    id: 'create-payment-method',
    label: 'Create payment method',
    group: 'Create',
    keywords: ['new account', 'new card'],
    href: '/payment-methods?intent=create',
  },
  {
    id: 'create-recurring-payment',
    label: 'Create recurring payment',
    group: 'Create',
    keywords: ['new subscription', 'new recurring'],
    href: '/recurring-payments?intent=create',
  },
  {
    id: 'create-budget',
    label: 'Create budget',
    group: 'Create',
    keywords: ['new budget', 'plan spending'],
    href: '/budgets?intent=create',
  },
  {
    id: 'add-attachment',
    label: 'Add attachment to transaction',
    group: 'Create',
    keywords: ['receipt', 'upload image'],
    href: '/transactions?intent=attach',
  },
  {
    id: 'report-current-month',
    label: 'Open current month report',
    group: 'Report',
    keywords: ['report this month', 'monthly analytics'],
    href: () => `/analytics?period=${new Date().toISOString().slice(0, 7)}`,
  },
  {
    id: 'report-current-year',
    label: 'Open current year report',
    group: 'Report',
    keywords: ['report this year', 'annual report'],
    href: () => `/reports?year=${new Date().getFullYear()}`,
  },
  {
    id: 'settings-sessions',
    label: 'Manage sessions',
    group: 'Account',
    keywords: ['devices', 'security'],
    href: '/settings/sessions',
  },
  {
    id: 'settings-api-keys',
    label: 'Manage API keys',
    group: 'Account',
    keywords: ['developer access', 'token'],
    href: '/settings/api-keys',
  },
  {
    id: 'settings-profile',
    label: 'Manage profile and preferences',
    group: 'Settings',
    keywords: ['email', 'password', 'locale', 'currency', 'theme'],
    href: '/settings/profile',
  },
  {
    id: 'search-transactions',
    label: 'Search transactions',
    group: 'Search',
    keywords: ['find transaction', 'transaction search'],
    href: input => `/transactions?search=${encodeURIComponent(input)}`,
  },
];

export function availableCommands(context: CommandContext, query: string): CommandDefinition[] {
  const normalized = query.trim().toLocaleLowerCase();
  return commandRegistry.filter(
    command =>
      (command.available?.(context) ?? true) &&
      (!normalized || `${command.label} ${command.keywords.join(' ')}`.toLocaleLowerCase().includes(normalized)),
  );
}

export function resolveTypedIntent(input: string, context: CommandContext): ResolvedCommand | null {
  const trimmed = input.trim();
  const transactionMatch = /^(?:search\s+)?transactions?\s+(.+)$/i.exec(trimmed);
  if (transactionMatch) {
    const command = commandRegistry.find(item => item.id === 'search-transactions')!;
    return {command, href: (command.href as (value: string) => string)(transactionMatch[1]!)};
  }
  const editMatch = /^edit\s+(transaction|category|payment method|recurring payment|budget)\s+(.+)$/i.exec(trimmed);
  if (editMatch) {
    const routes: Record<string, string> = {
      transaction: 'transactions',
      category: 'categories',
      'payment method': 'payment-methods',
      'recurring payment': 'recurring-payments',
      budget: 'budgets',
    };
    const kind = editMatch[1]!.toLocaleLowerCase();
    const object = editMatch[2]!;
    const route = routes[kind]!;
    const href = `/${route}?search=${encodeURIComponent(object)}&intent=edit&object=${encodeURIComponent(object)}`;
    return {
      command: {
        id: `edit-${kind.replaceAll(' ', '-')}`,
        label: `Edit ${kind}: ${object}`,
        group: 'Edit',
        keywords: [],
        href,
      },
      href,
    };
  }
  const monthReport = /^(?:report)\s+(\d{4}-(?:0[1-9]|1[0-2]))$/i.exec(trimmed);
  if (monthReport)
    return {
      command: {
        id: 'report-month',
        label: `Analyze ${monthReport[1]}`,
        group: 'Report',
        keywords: [],
        href: `/analytics?period=${monthReport[1]}`,
      },
      href: `/analytics?period=${monthReport[1]}`,
    };
  const yearReport = /^report\s+(\d{4})$/i.exec(trimmed);
  if (yearReport)
    return {
      command: {
        id: 'report-year',
        label: `Report ${yearReport[1]}`,
        group: 'Report',
        keywords: [],
        href: `/reports?year=${yearReport[1]}`,
      },
      href: `/reports?year=${yearReport[1]}`,
    };
  const exact =
    availableCommands(context, trimmed).find(
      command => command.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    ) ?? availableCommands(context, trimmed)[0];
  if (!exact) return null;
  return {command: exact, href: typeof exact.href === 'function' ? exact.href(trimmed) : exact.href};
}
