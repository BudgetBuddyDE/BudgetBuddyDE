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
  website: string;
  repository: string;
  theme: Theme;
  auth: {
    cookieName: string;
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
  website: 'https://budget-buddy.de',
  repository: 'https://github.com/BudgetBuddyDE/webapp',
  theme: BlueTheme,
  auth: {
    cookieName: 'budget-buddy.auth',
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
