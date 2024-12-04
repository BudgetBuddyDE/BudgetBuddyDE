import {type Config} from 'jest';

const JestConfig: Config = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testRegex: '\\.(test|spec)\\.(ts)?$',
  moduleFileExtensions: ['ts', 'js'],
  silent: true,
};

module.exports = JestConfig;
