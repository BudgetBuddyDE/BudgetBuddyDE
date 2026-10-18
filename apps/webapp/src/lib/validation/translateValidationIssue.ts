import type {AppTranslator} from '@/lib/i18n/translate';

export type ValidationIssue = {
  message: string;
  code?: string;
  expected?: string;
  origin?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  inclusive?: boolean;
  format?: string;
};

// Translate issue metadata per call, without changing Zod's process-wide error configuration.
export function translateValidationIssue(issue: ValidationIssue, t: AppTranslator): string {
  switch (issue.code) {
    case 'invalid_type':
      switch (issue.expected) {
        case 'string':
          return t('Enter a valid text value.');
        case 'number':
          return t('Enter a valid number.');
        case 'date':
          return t('Enter a valid date.');
        case 'boolean':
          return t('Select a valid boolean value.');
        case 'array':
          return t('Select valid items.');
        default:
          return t('Enter a valid value.');
      }
    case 'too_small':
      if (issue.minimum === undefined) return t('The value is too small.');
      if (issue.origin === 'string') {
        return t('Enter at least {minimum} characters.', {minimum: String(issue.minimum)});
      }
      if (issue.origin === 'array') {
        return t('Select at least {minimum} items.', {minimum: String(issue.minimum)});
      }
      return issue.inclusive === false
        ? t('Enter a value greater than {minimum}.', {minimum: String(issue.minimum)})
        : t('Enter a value of at least {minimum}.', {minimum: String(issue.minimum)});
    case 'too_big':
      if (issue.maximum === undefined) return t('The value is too large.');
      if (issue.origin === 'string') {
        return t('Enter no more than {maximum} characters.', {maximum: String(issue.maximum)});
      }
      if (issue.origin === 'array') {
        return t('Select no more than {maximum} items.', {maximum: String(issue.maximum)});
      }
      return issue.inclusive === false
        ? t('Enter a value less than {maximum}.', {maximum: String(issue.maximum)})
        : t('Enter a value of at most {maximum}.', {maximum: String(issue.maximum)});
    case 'invalid_format':
      switch (issue.format) {
        case 'uuid':
          return t('Select a valid item.');
        case 'email':
          return t('Enter a valid email address.');
        case 'url':
          return t('Enter a valid URL.');
        default:
          return t('Enter a value in the correct format.');
      }
    case 'invalid_value':
      return t('Select a valid option.');
    default:
      return t('Enter a valid value.');
  }
}
