import type {AppTranslator} from '@/i18n/translate';

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
          return t('validation.invalidType.string');
        case 'number':
          return t('validation.invalidType.number');
        case 'date':
          return t('validation.invalidType.date');
        case 'boolean':
          return t('validation.invalidType.boolean');
        case 'array':
          return t('validation.invalidType.array');
        default:
          return t('validation.invalidType.default');
      }
    case 'too_small':
      if (issue.minimum === undefined) return t('validation.tooSmall.default');
      if (issue.origin === 'string') {
        return t('validation.tooSmall.string', {minimum: String(issue.minimum)});
      }
      if (issue.origin === 'array') {
        return t('validation.tooSmall.array', {minimum: String(issue.minimum)});
      }
      return issue.inclusive === false
        ? t('validation.tooSmall.exclusive', {minimum: String(issue.minimum)})
        : t('validation.tooSmall.inclusive', {minimum: String(issue.minimum)});
    case 'too_big':
      if (issue.maximum === undefined) return t('validation.tooBig.default');
      if (issue.origin === 'string') {
        return t('validation.tooBig.string', {maximum: String(issue.maximum)});
      }
      if (issue.origin === 'array') {
        return t('validation.tooBig.array', {maximum: String(issue.maximum)});
      }
      return issue.inclusive === false
        ? t('validation.tooBig.exclusive', {maximum: String(issue.maximum)})
        : t('validation.tooBig.inclusive', {maximum: String(issue.maximum)});
    case 'invalid_format':
      switch (issue.format) {
        case 'uuid':
          return t('validation.invalidFormat.uuid');
        case 'email':
          return t('validation.invalidFormat.email');
        case 'url':
          return t('validation.invalidFormat.url');
        default:
          return t('validation.invalidFormat.default');
      }
    case 'invalid_value':
      return t('validation.invalidValue');
    default:
      return t('validation.default');
  }
}
