import {resolveAppLocale} from './config';
import accountEn from './messages/en-US/account.json';
import attachmentsEn from './messages/en-US/attachments.json';
import authEn from './messages/en-US/auth.json';
import budgetsEn from './messages/en-US/budgets.json';
import categoriesEn from './messages/en-US/categories.json';
import chartsEn from './messages/en-US/charts.json';
import commandPaletteEn from './messages/en-US/commandPalette.json';
import commonEn from './messages/en-US/common.json';
import dashboardEn from './messages/en-US/dashboard.json';
import entitiesEn from './messages/en-US/entities.json';
import errorsEn from './messages/en-US/errors.json';
import formsEn from './messages/en-US/forms.json';
import insightsEn from './messages/en-US/insights.json';
import intentsEn from './messages/en-US/intents.json';
import navigationEn from './messages/en-US/navigation.json';
import paymentMethodsEn from './messages/en-US/paymentMethods.json';
import recurringPaymentsEn from './messages/en-US/recurringPayments.json';
import settingsEn from './messages/en-US/settings.json';
import tableEn from './messages/en-US/table.json';
import transactionsEn from './messages/en-US/transactions.json';
import validationEn from './messages/en-US/validation.json';

export const englishMessages = {
  account: accountEn,
  attachments: attachmentsEn,
  auth: authEn,
  budgets: budgetsEn,
  categories: categoriesEn,
  charts: chartsEn,
  commandPalette: commandPaletteEn,
  common: commonEn,
  dashboard: dashboardEn,
  entities: entitiesEn,
  errors: errorsEn,
  forms: formsEn,
  insights: insightsEn,
  intents: intentsEn,
  navigation: navigationEn,
  paymentMethods: paymentMethodsEn,
  recurringPayments: recurringPaymentsEn,
  settings: settingsEn,
  table: tableEn,
  transactions: transactionsEn,
  validation: validationEn,
};
export type AppMessages = typeof englishMessages;

type StringKey<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends Record<string, unknown>
      ? `${K}.${StringKey<T[K]>}`
      : never;
}[keyof T & string];

export type AppTranslationKey = StringKey<AppMessages>;

async function loadGermanMessages(): Promise<AppMessages> {
  const loaded = await Promise.all([
    import('./messages/de-DE/account.json'),
    import('./messages/de-DE/attachments.json'),
    import('./messages/de-DE/auth.json'),
    import('./messages/de-DE/budgets.json'),
    import('./messages/de-DE/categories.json'),
    import('./messages/de-DE/charts.json'),
    import('./messages/de-DE/commandPalette.json'),
    import('./messages/de-DE/common.json'),
    import('./messages/de-DE/dashboard.json'),
    import('./messages/de-DE/entities.json'),
    import('./messages/de-DE/errors.json'),
    import('./messages/de-DE/forms.json'),
    import('./messages/de-DE/insights.json'),
    import('./messages/de-DE/intents.json'),
    import('./messages/de-DE/navigation.json'),
    import('./messages/de-DE/paymentMethods.json'),
    import('./messages/de-DE/recurringPayments.json'),
    import('./messages/de-DE/settings.json'),
    import('./messages/de-DE/table.json'),
    import('./messages/de-DE/transactions.json'),
    import('./messages/de-DE/validation.json'),
  ]);
  return {
    account: loaded[0],
    attachments: loaded[1],
    auth: loaded[2],
    budgets: loaded[3],
    categories: loaded[4],
    charts: loaded[5],
    commandPalette: loaded[6],
    common: loaded[7],
    dashboard: loaded[8],
    entities: loaded[9],
    errors: loaded[10],
    forms: loaded[11],
    insights: loaded[12],
    intents: loaded[13],
    navigation: loaded[14],
    paymentMethods: loaded[15],
    recurringPayments: loaded[16],
    settings: loaded[17],
    table: loaded[18],
    transactions: loaded[19],
    validation: loaded[20],
  } as unknown as AppMessages;
}

const localeLoaders = {
  'en-US': () => englishMessages,
  'de-DE': loadGermanMessages,
};

export async function getMessagesForLocale(locale?: string | null): Promise<AppMessages> {
  return localeLoaders[resolveAppLocale(locale)]();
}
