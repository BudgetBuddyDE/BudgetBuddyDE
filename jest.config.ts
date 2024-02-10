import {type Config} from 'jest';

const JestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  // collectCoverage: true,
  // coverageThreshold: {
  //   global: {
  //     statements: 90,
  //     branches: 90,
  //     functions: 90,
  //     lines: 90,
  //   },
  // },
  testEnvironment: 'node',
  testRegex: '\\.(test|spec)\\.(ts)?$',
  moduleFileExtensions: ['ts', 'js'],
  modulePathIgnorePatterns: ['<rootDir>/.env'],
  silent: true,
  verbose: true,
};

module.exports = JestConfig;
