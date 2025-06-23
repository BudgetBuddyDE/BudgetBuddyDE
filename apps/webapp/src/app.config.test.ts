import {describe, expect, it} from 'vitest';

import {AppConfig, Feature} from './app.config';

describe('AppConfig', () => {
  it('should have the correct feature', () => {
    expect(AppConfig.feature[Feature.STOCKS]).toBe(import.meta.env.VITE_STOCK_SERVICE_HOST !== undefined);
  });
});
