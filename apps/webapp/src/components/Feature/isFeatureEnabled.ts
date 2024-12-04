import {AppConfig, Feature} from '@/app.config';

/**
 * Checks if a specific feature is enabled.
 *
 * @param feature - The feature to check.
 * @returns `true` if the feature is enabled, `false` otherwise.
 */
export function isFeatureEnabled(feature: Feature) {
  return AppConfig.feature[feature];
}
