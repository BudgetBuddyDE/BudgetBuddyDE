import {type LogLevel} from '@budgetbuddyde/utils/lib/logger';
import {type TableCellProps, type Theme} from '@mui/material';

import BlueTheme from '@/style/theme/theme';

import {version} from '../package.json';

export enum Feature {
  STOCKS = 'stocks',
  NEWSLETTER = 'newsletter',
  ENVIRONMENT_DISCLAIMER = 'environment-disclaimer',
}

export type TAppConfig = {
  production: boolean;
  appName: string;
  version: typeof version;
  logLevel: LogLevel;
  website: string;
  repository: string;
  theme: Theme;
  auth: {
    cookieName: string;
  };
  user: {
    deletionThreshold: number;
  };
  table: {
    cellSize: TableCellProps['size'];
  };
  baseSpacing: number;
  authProvider: Record<string, string>;
  feature: Record<Feature, boolean>;
};

export const AppConfig: TAppConfig = {
  production: process.env.NODE_ENV === 'production',
  appName: 'Budget-Buddy',
  version: version,
  logLevel: (process.env.LOG_LEVEL ?? 'error') as LogLevel,
  website: 'https://budget-buddy.de',
  repository: 'https://github.com/BudgetBuddyDE/webapp',
  theme: BlueTheme,
  auth: {
    cookieName: 'budget-buddy.auth',
  },
  user: {
    deletionThreshold: 30,
  },
  table: {
    cellSize: 'medium',
  },
  baseSpacing: 2,
  authProvider: {
    google: 'Google',
    github: 'GitHub',
  },
  feature: {
    [Feature.ENVIRONMENT_DISCLAIMER]: process.env.SHOW_ENVIRONMENT_DISCLAIMER === 'true',
    [Feature.STOCKS]: process.env.STOCK_SERVICE_HOST !== undefined,
    [Feature.NEWSLETTER]: process.env.MAIL_SERVICE_HOST !== undefined,
  },
};
