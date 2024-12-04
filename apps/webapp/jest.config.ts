import { type Config } from 'jest';

const JestConfig: Config = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'jsdom',
  testRegex: '\\.(test|spec)\\.(ts|tsx)?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  silent: true,
  globals: {
    'process.env': {
      NODE_ENV: 'test',
    },
  },
};

module.exports = JestConfig;
