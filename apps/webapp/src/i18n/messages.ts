import {resolveAppLocale} from './config';
import accountDe from './messages/de-DE/account.json';
import attachmentsDe from './messages/de-DE/attachments.json';
import authDe from './messages/de-DE/auth.json';
import budgetsDe from './messages/de-DE/budgets.json';
import categoriesDe from './messages/de-DE/categories.json';
import chartsDe from './messages/de-DE/charts.json';
import commandPaletteDe from './messages/de-DE/commandPalette.json';
import commonDe from './messages/de-DE/common.json';
import dashboardDe from './messages/de-DE/dashboard.json';
import entitiesDe from './messages/de-DE/entities.json';
import errorsDe from './messages/de-DE/errors.json';
import formsDe from './messages/de-DE/forms.json';
import insightsDe from './messages/de-DE/insights.json';
import intentsDe from './messages/de-DE/intents.json';
import navigationDe from './messages/de-DE/navigation.json';
import paymentMethodsDe from './messages/de-DE/paymentMethods.json';
import recurringPaymentsDe from './messages/de-DE/recurringPayments.json';
import settingsDe from './messages/de-DE/settings.json';
import tableDe from './messages/de-DE/table.json';
import transactionsDe from './messages/de-DE/transactions.json';
import validationDe from './messages/de-DE/validation.json';
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

const germanMessages = {
  account: accountDe,
  attachments: attachmentsDe,
  auth: authDe,
  budgets: budgetsDe,
  categories: categoriesDe,
  charts: chartsDe,
  commandPalette: commandPaletteDe,
  common: commonDe,
  dashboard: dashboardDe,
  entities: entitiesDe,
  errors: errorsDe,
  forms: formsDe,
  insights: insightsDe,
  intents: intentsDe,
  navigation: navigationDe,
  paymentMethods: paymentMethodsDe,
  recurringPayments: recurringPaymentsDe,
  settings: settingsDe,
  table: tableDe,
  transactions: transactionsDe,
  validation: validationDe,
} satisfies AppMessages;

export function getMessagesForLocale(locale?: string | null): AppMessages {
  return resolveAppLocale(locale) === 'de-DE' ? germanMessages : englishMessages;
}
