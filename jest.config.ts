import { type Config } from 'jest';

const JestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/src/config.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testRegex: '\\.(test|spec)\\.(ts)?$',
  moduleFileExtensions: ['ts', 'js'],
  silent: true,
  globals: {
    'process.env': {
      // NODE_ENV: 'test',
    },
  },
};

module.exports = JestConfig;
