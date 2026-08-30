import {BackendConfig} from './BackendConfig';
import {Config} from './Config';

describe('Config', () => {
  it('stores immutable common service properties', () => {
    const config = new Config({service: 'service', version: '1.0.0', runtime: 'test'});

    expect(config).toMatchObject({service: 'service', version: '1.0.0', runtime: 'test'});
  });

  it('extends the common properties with the backend port', () => {
    const config = new BackendConfig({service: 'backend', version: '1.0.0', runtime: 'test', port: 9000});

    expect(config).toBeInstanceOf(Config);
    expect(config.port).toBe(9000);
  });
});
