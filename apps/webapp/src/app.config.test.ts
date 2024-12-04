import {describe, expect, it} from 'vitest';

import {AppConfig, Feature} from './app.config';

describe('AppConfig', () => {
  it('should have the correct feature', () => {
    expect(AppConfig.feature[Feature.STOCKS]).toBe(process.env.STOCK_SERVICE_HOST !== undefined);
  });
});
